const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static(uploadDir));

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Allowed extensions (more reliable than mimetype)
const allowedExtensions = [
  ".pdf", ".xls", ".xlsx",
  ".doc", ".docx",
  ".xml",
  ".jpg", ".jpeg", ".png", ".webp"
];

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Upload route
app.post("/upload", (req, res) => {
  upload.single("file")(req, res, err => {
    if (err) {
      return res.status(400).send(err.message);
    }
    res.redirect("/");
  });
});

// List files
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

app.delete("/delete", express.json(), (req, res) => {
  const fileName = req.body.file;

  if (!fileName) {
    return res.status(400).json({ error: "No file specified" });
  }

  const filePath = path.join(uploadDir, fileName);

  // Extra safety
  if (!filePath.startsWith(uploadDir)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  fs.unlink(filePath, err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ success: true });
  });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
