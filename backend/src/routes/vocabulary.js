const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

// Get all vocabulary sets
router.get('/sets', (req, res) => {
    try {
        const sets = db.prepare(`
      SELECT vs.*, COUNT(f.id) as card_count 
      FROM vocabulary_sets vs 
      LEFT JOIN flashcards f ON vs.id = f.set_id 
      GROUP BY vs.id 
      ORDER BY vs.sort_order ASC, vs.created_at DESC
    `).all();
        res.json(sets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single vocabulary set with its flashcards
router.get('/sets/:id', (req, res) => {
    try {
        const set = db.prepare('SELECT * FROM vocabulary_sets WHERE id = ?').get(req.params.id);
        if (!set) {
            return res.status(404).json({ error: 'Vocabulary set not found' });
        }

        // Only get flashcards that are not learned (learned = 0 or NULL)
        const includeAll = req.query.includeAll === 'true';
        const flashcards = includeAll
            ? db.prepare('SELECT * FROM flashcards WHERE set_id = ?').all(req.params.id)
            : db.prepare('SELECT * FROM flashcards WHERE set_id = ? AND (learned = 0 OR learned IS NULL)').all(req.params.id);

        // Also get total count for progress tracking
        const totalCount = db.prepare('SELECT COUNT(*) as count FROM flashcards WHERE set_id = ?').get(req.params.id).count;
        const learnedCount = db.prepare('SELECT COUNT(*) as count FROM flashcards WHERE set_id = ? AND learned = 1').get(req.params.id).count;

        res.json({ ...set, flashcards, totalCount, learnedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload Excel file and create vocabulary set
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const setName = req.body.name || path.parse(req.file.originalname).name;
        const description = req.body.description || '';

        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        // Create vocabulary set
        const insertSet = db.prepare(`
      INSERT INTO vocabulary_sets (name, description) VALUES (?, ?)
    `);
        const setResult = insertSet.run(setName, description);
        const setId = setResult.lastInsertRowid;

        // Prepare flashcard insert statement
        const insertCard = db.prepare(`
      INSERT INTO flashcards (set_id, kanji, meaning, pronunciation, sino_vietnamese, example)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        // Insert flashcards in a transaction for better performance
        const insertMany = db.transaction((cards) => {
            for (const card of cards) {
                insertCard.run(
                    setId,
                    card.kanji || card['Kanji'] || card['漢字'] || '',
                    card.meaning || card['Meaning'] || card['Nghĩa'] || card['nghĩa'] || '',
                    card.pronunciation || card['Pronunciation'] || card['Phiên âm'] || card['Hiragana'] || card['ひらがな'] || '',
                    card.sino_vietnamese || card['Sino-Vietnamese'] || card['Hán Việt'] || card['hán việt'] || '',
                    card.example || card['Example'] || card['Ví dụ'] || card['例文'] || ''
                );
            }
        });

        insertMany(data);

        // Clean up uploaded file after processing
        fs.unlinkSync(filePath);

        res.status(201).json({
            message: 'Vocabulary set created successfully',
            setId,
            cardCount: data.length
        });
    } catch (error) {
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete vocabulary set
router.delete('/sets/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM vocabulary_sets WHERE id = ?').run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Vocabulary set not found' });
        }
        res.json({ message: 'Vocabulary set deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update vocabulary set name/description/default_face
router.patch('/sets/:id', (req, res) => {
    try {
        const { name, description, default_face } = req.body;
        const result = db.prepare(`
      UPDATE vocabulary_sets 
      SET name = COALESCE(?, name), 
          description = COALESCE(?, description),
          default_face = COALESCE(?, default_face),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, default_face, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Vocabulary set not found' });
        }

        const updated = db.prepare('SELECT * FROM vocabulary_sets WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark a flashcard as learned or not learned
router.patch('/flashcards/:id/learned', (req, res) => {
    try {
        const { learned } = req.body;
        const result = db.prepare(`
            UPDATE flashcards 
            SET learned = ?
            WHERE id = ?
        `).run(learned ? 1 : 0, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }

        res.json({ message: 'Flashcard updated successfully', learned: !!learned });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset all flashcards in a set to not learned
router.post('/sets/:id/reset', (req, res) => {
    try {
        const result = db.prepare(`
            UPDATE flashcards 
            SET learned = 0
            WHERE set_id = ?
        `).run(req.params.id);

        res.json({ message: 'All flashcards reset successfully', count: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reorder vocabulary sets
router.post('/sets/reorder', (req, res) => {
    try {
        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ error: 'orderedIds must be an array' });
        }

        const updateOrder = db.prepare(`
            UPDATE vocabulary_sets 
            SET sort_order = ?
            WHERE id = ?
        `);

        const updateMany = db.transaction((ids) => {
            ids.forEach((id, index) => {
                updateOrder.run(index, id);
            });
        });

        updateMany(orderedIds);

        res.json({ message: 'Sets reordered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
