#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const fixturesDir = path.resolve(__dirname, "tests/fixtures");
const files = ["file1.gpkg", "file2.gpkg"];

if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
  console.log(`Created directory: ${fixturesDir}`);
}

files.forEach((filename) => {
  const filepath = path.join(fixturesDir, filename);

  if (fs.existsSync(filepath)) {
    console.log(`Skipped (already exists): ${filename}`);
    return;
  }

  const db = new Database(filepath);
  db.exec(`
    CREATE TABLE tiles (
      zoom_level INTEGER,
      tile_column INTEGER,
      tile_row INTEGER,
      tile_data BLOB
    );
  `);
  db.close();

  console.log(`Created fixture DB: ${filename}`);
});

const testFiles = [
  "copyTileMetadata.test.ts",
  "createTileTable.test.ts",
  "mergeTileData.test.ts",
];

testFiles.forEach((file) => {
  const testPath = path.resolve(__dirname, file);
  if (!fs.existsSync(testPath)) {
    console.warn(`Test file not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(testPath, "utf8");

  if (!content.includes("import path from 'path'")) {
    content = "import path from 'path';\n" + content;
  }

  content = content.replace(
    /['"]file1\.gpkg['"]/g,
    "path.resolve(__dirname, 'fixtures/file1.gpkg')"
  );
  content = content.replace(
    /['"]file2\.gpkg['"]/g,
    "path.resolve(__dirname, 'fixtures/file2.gpkg')"
  );

  fs.writeFileSync(testPath, content, "utf8");
  console.log(`Updated test file: ${file}`);
});

console.log("Setup complete. You can now run your tests.");
touch setup-test-fixtures.ts
