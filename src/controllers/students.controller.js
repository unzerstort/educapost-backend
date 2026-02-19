import bcrypt from "bcryptjs";
import {
  getStudentById,
  getStudentByEmail,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudentById,
} from "../models/students.model.js";

function validateStudentPayload(body, forCreate = false) {
  const errors = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length < 2) {
    errors.push("name must be at least 2 characters");
  }
  if (!email) {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email must be valid");
  }
  if (forCreate) {
    if (!password || password.length < 6) {
      errors.push("password must be at least 6 characters");
    }
  } else if (password && password.length < 6) {
    errors.push("password must be at least 6 characters when provided");
  }
  return { errors, name, email, password };
}

export async function getStudents(req, res) {
  try {
    const list = await listStudents();
    return res.json({ items: list });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function getStudentByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const row = await getStudentById(id);
    if (!row) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function getMeStudent(req, res) {
  try {
    const s = req.student;
    return res.json({
      id: s.id,
      name: s.name,
      email: s.email,
      createdAt: s.createdAt,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function createStudentHandler(req, res) {
  try {
    const { errors, name, email, password } = validateStudentPayload(req.body || {}, true);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    const existing = await getStudentByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await createStudent({ name, email, passwordHash });
    if (!created) {
      return res.status(500).json({ message: "Database error" });
    }
    return res.status(201).json(created);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function updateMeStudent(req, res) {
  try {
    const id = req.student.id;
    const { errors, name, email, password } = validateStudentPayload(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    if (email) {
      const existing = await getStudentByEmail(email);
      if (existing && existing.id !== id) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    const updates = { name: name || req.student.name, email: email || req.student.email };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }
    const updated = await updateStudent(id, updates);
    if (!updated) {
      return res.status(500).json({ message: "Database error" });
    }
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function updateStudentByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const { errors, name, email, password } = validateStudentPayload(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    const existing = await getStudentById(id);
    if (!existing) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (email && email !== existing.email) {
      const byEmail = await getStudentByEmail(email);
      if (byEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    if (Object.keys(updates).length === 0) {
      return res.json({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        createdAt: existing.createdAt,
      });
    }
    const updated = await updateStudent(id, updates);
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function deleteMeStudent(req, res) {
  try {
    await deleteStudentById(req.student.id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function deleteStudentByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const existing = await getStudentById(id);
    if (!existing) {
      return res.status(404).json({ message: "Student not found" });
    }
    await deleteStudentById(id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
