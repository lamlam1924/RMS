import pool from '../config/db.js';

/**
 * Resume Service - Business logic for resume CRUD operations
 */

/**
 * Create a new resume
 * @param {number} candidateId - Candidate identifier
 * @param {object} data - Resume data (JSON)
 * @returns {Promise<{id: number}>}
 */
export async function createResume(candidateId, data) {
  const [result] = await pool.execute(
    'INSERT INTO resumes (candidateId, data) VALUES (?, ?)',
    [candidateId, JSON.stringify(data)]
  );
  return { id: result.insertId };
}

/**
 * Get resume by ID
 * @param {number} id - Resume ID
 * @returns {Promise<object|null>}
 */
export async function getResumeById(id) {
  const [rows] = await pool.execute(
    'SELECT id, candidateId, data, createdAt, updatedAt FROM resumes WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    candidateId: row.candidateId,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Update resume by ID
 * @param {number} id - Resume ID
 * @param {object} data - Resume data (JSON)
 * @returns {Promise<boolean>}
 */
export async function updateResume(id, data) {
  const [result] = await pool.execute(
    'UPDATE resumes SET data = ? WHERE id = ?',
    [JSON.stringify(data), id]
  );
  return result.affectedRows > 0;
}

/**
 * Delete resume by ID
 * @param {number} id - Resume ID
 * @returns {Promise<boolean>}
 */
export async function deleteResume(id) {
  const [result] = await pool.execute('DELETE FROM resumes WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
