import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4001;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

/** CREATE */
app.post("/assignments", async (req, res) => {
  const newAssignment = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: new Date(),
  };

  try {
    const result = await connectionPool.query(
      `INSERT INTO assignments (
        user_id, title, content, category, length,
        created_at, updated_at, published_at, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING assignment_id`,
      [
        newAssignment.user_id,
        newAssignment.title,
        newAssignment.content,
        newAssignment.category,
        newAssignment.length,
        newAssignment.created_at,
        newAssignment.updated_at,
        newAssignment.published_at,
        newAssignment.status,
      ]
    );

    return res.status(201).json({
      message: "Created assignment successfully",
      id: result.rows[0].assignment_id,
    });
  } catch (error) {
    console.error("Error in POST /assignments:", error.message);
    return res.status(500).json({
      message: "Server could not create assignment due to database error",
      error: error.message,
    });
  }
});

/** READ ALL */
app.get("/assignments", async (req, res) => {
  try {
    const results = await connectionPool.query(`SELECT * FROM assignments`);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error("Error in GET /assignments:", error.message);
    return res.status(500).json({
      message: "Server could not read assignments due to database error",
      error: error.message,
    });
  }
});

/** READ ONE */
app.get("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;
    const results = await connectionPool.query(
      `SELECT * FROM assignments WHERE assignment_id = $1`,
      [assignmentIdFromClient]
    );

    if (!results.rows[0]) {
      return res
        .status(404)
        .json({ message: `Server could not find assignment (id: ${assignmentIdFromClient})` });
    }

    return res.status(200).json({ data: results.rows[0] });
  } catch (error) {
    console.error("Error in GET /assignments/:assignmentId:", error.message);
    return res.status(500).json({
      message: "Server encountered an error while retrieving the assignment",
      error: error.message,
    });
  }
});

/** UPDATE */
app.put("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;
    const updatedAssignments = { ...req.body, updated_at: new Date() };

    const result = await connectionPool.query(
      `UPDATE assignments
       SET title = $2,
           content = $3,
           category = $4,
           length = $5,
           status = $6,
           updated_at = $7
       WHERE assignment_id = $1`,
      [
        assignmentIdFromClient,
        updatedAssignments.title,
        updatedAssignments.content,
        updatedAssignments.category,
        updatedAssignments.length,
        updatedAssignments.status,
        updatedAssignments.updated_at,
      ]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: `Server could not find assignment to update (id: ${assignmentIdFromClient})` });
    }

    return res.status(200).json({ message: "Updated assignment successfully" });
  } catch (error) {
    console.error("Error in PUT /assignments/:assignmentId:", error.message);
    return res.status(500).json({
      message: "Server could not update assignment due to database error",
      error: error.message,
    });
  }
});

/** DELETE */
app.delete("/assignments/:assignmentId", async (req, res) => {
  try {
    const assignmentIdFromClient = req.params.assignmentId;
    const result = await connectionPool.query(
      `DELETE FROM assignments WHERE assignment_id = $1`,
      [assignmentIdFromClient]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: `Server could not find assignment to delete (id: ${assignmentIdFromClient})` });
    }

    return res.status(204).send(); // No Content
  } catch (error) {
    console.error("Error in DELETE /assignments/:assignmentId:", error.message);
    return res.status(500).json({
      message: "Server could not delete assignment due to database error",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
