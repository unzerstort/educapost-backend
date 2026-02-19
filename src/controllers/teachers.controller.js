import bcrypt from "bcryptjs";
import {
  getTeacherById,
  getTeacherByEmail,
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacherById,
} from "../models/teachers.model.js";

function validateTeacherPayload(body, forCreate = false) {
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

export async function getTeachers(req, res) {
  try {
    const list = await listTeachers();
    return res.json({ items: list });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function getTeacherByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const row = await getTeacherById(id);
    if (!row) {
      return res.status(404).json({ message: "Teacher not found" });
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

export async function getMeTeacher(req, res) {
  try {
    const t = req.teacher;
    return res.json({
      id: t.id,
      name: t.name,
      email: t.email,
      createdAt: t.createdAt,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function createTeacherHandler(req, res) {
  try {
    const { errors, name, email, password } = validateTeacherPayload(req.body || {}, true);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    const existing = await getTeacherByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await createTeacher({ name, email, passwordHash });
    if (!created) {
      return res.status(500).json({ message: "Database error" });
    }
    return res.status(201).json(created);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function updateMeTeacher(req, res) {
  try {
    const id = req.teacher.id;
    const { errors, name, email, password } = validateTeacherPayload(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    if (email) {
      const existing = await getTeacherByEmail(email);
      if (existing && existing.id !== id) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    const updates = { name: name || req.teacher.name, email: email || req.teacher.email };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }
    const updated = await updateTeacher(id, updates);
    if (!updated) {
      return res.status(500).json({ message: "Database error" });
    }
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function updateTeacherByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const { errors, name, email, password } = validateTeacherPayload(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    const existing = await getTeacherById(id);
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    if (email && email !== existing.email) {
      const byEmail = await getTeacherByEmail(email);
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
    const updated = await updateTeacher(id, updates);
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function deleteMeTeacher(req, res) {
  try {
    await deleteTeacherById(req.teacher.id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}

export async function deleteTeacherByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const existing = await getTeacherById(id);
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    await deleteTeacherById(id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
}
