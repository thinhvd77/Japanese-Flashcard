const API_BASE = '/api';

export async function getVocabularySets() {
    const response = await fetch(`${API_BASE}/vocabulary/sets`);
    if (!response.ok) {
        throw new Error('Failed to fetch vocabulary sets');
    }
    return response.json();
}

export async function getVocabularySet(id) {
    const response = await fetch(`${API_BASE}/vocabulary/sets/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch vocabulary set');
    }
    return response.json();
}

export async function uploadVocabularySet(file, name, description = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);

    const response = await fetch(`${API_BASE}/vocabulary/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
}

export async function deleteVocabularySet(id) {
    const response = await fetch(`${API_BASE}/vocabulary/sets/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete vocabulary set');
    }

    return response.json();
}

export async function updateVocabularySet(id, data) {
    const response = await fetch(`${API_BASE}/vocabulary/sets/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update vocabulary set');
    }

    return response.json();
}

export async function markFlashcardLearned(id, learned) {
    const response = await fetch(`${API_BASE}/vocabulary/flashcards/${id}/learned`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ learned }),
    });

    if (!response.ok) {
        throw new Error('Failed to update flashcard');
    }

    return response.json();
}

export async function resetVocabularySet(id) {
    const response = await fetch(`${API_BASE}/vocabulary/sets/${id}/reset`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to reset vocabulary set');
    }

    return response.json();
}

export async function reorderVocabularySets(orderedIds) {
    const response = await fetch(`${API_BASE}/vocabulary/sets/reorder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
    });

    if (!response.ok) {
        throw new Error('Failed to reorder vocabulary sets');
    }

    return response.json();
}
