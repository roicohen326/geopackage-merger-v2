import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { StatusCodes } from 'http-status-codes';

interface TableInfo {
  name: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface SqlResult {
  changes: number;
}

interface CountResult {
  count: number;
}

const BYTES_TO_MB = 1024 * 1024;

console.log("GeoPackage Tile-Aware Merge Tool");

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage: npm run merge <file1> <file2> [output] [table_name]

Examples:
  npm run merge ./data/file1.gpkg ./data/file2.gpkg
  npm run merge ./data/file1.gpkg ./data/file2.gpkg ./output.gpkg unified_tiles`);
  process.exit(1);
}

const file1 = args[0];
const file2 = args[1];
const outputTableName = args[3] || 'merged_tiles';

function validateFilesExist(file1Path: string, file2Path: string): void {
  const file1Exists = fs.existsSync(file1Path);
  const file2Exists = fs.existsSync(file2Path);
  
  if (!file1Exists || !file2Exists) {
    const missingFiles = [
      !file1Exists ? file1Path : null,
      !file2Exists ? file2Path : null
    ].filter(Boolean);
    
    throw new Error(`Missing file(s): ${missingFiles.join(', ')}`);
  }
}

function getFileName(filepath: string): string {
  return path.basename(filepath, path.extname(filepath));
}

function createOutputFilename(file1Path: string, file2Path: string, customOutput?: string): string {
  if (customOutput) return customOutput;
  
  const name1 = getFileName(file1Path);
  const name2 = getFileName(file2Path);
  return `merged_${name1}_${name2}.gpkg`;
}

function ensureUniqueOutputFile(outputFilename: string): string {
  if (!fs.existsSync(outputFilename)) return outputFilename;
  
  const ext = path.extname(outputFilename);
  const nameWithoutExt = outputFilename.replace(ext, '');
  const uniqueFilename = `${nameWithoutExt}_${Date.now()}${ext}`;
  
  console.log(`Output file exists, creating: ${uniqueFilename}`);
  return uniqueFilename;
}

function getDataTables(database: Database.Database): TableInfo[] {
  const allTables = database.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type = 'table' 
    AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE 'gpkg_%'
    AND name NOT LIKE 'rtree_%'
    AND name NOT LIKE 'idx_%'
  `).all() as TableInfo[];
  
  return allTables;
}

function getTableColumns(database: Database.Database, tableName: string): ColumnInfo[] {
  return database.prepare(`PRAGMA table_info("${tableName}")`).all() as ColumnInfo[];
}

function copyTileMetadata(sourceDb: Database.Database, targetDb: Database.Database, sourceTableName: string, targetTableName: string): void {
  const contentsEntry = sourceDb.prepare(`
    SELECT * FROM gpkg_contents WHERE table_name = ?
  `).get(sourceTableName) as any;
  
  if (!contentsEntry) {
    throw new Error(`No gpkg_contents entry found for table: ${sourceTableName}`);
  }
  
  targetDb.prepare(`
    INSERT OR REPLACE INTO gpkg_contents 
    (table_name, data_type, identifier, description, last_change, min_x, min_y, max_x, max_y, srs_id)
    VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)
  `).run(
    targetTableName,
    contentsEntry.data_type,
    targetTableName,
    `Merged tiles from ${sourceTableName}`,
    contentsEntry.min_x,
    contentsEntry.min_y,
    contentsEntry.max_x,
    contentsEntry.max_y,
    contentsEntry.srs_id
  );
  
  const tileMatrixSet = sourceDb.prepare(`
    SELECT * FROM gpkg_tile_matrix_set WHERE table_name = ?
  `).get(sourceTableName) as any;
  
  if (!tileMatrixSet) {
    throw new Error(`No tile matrix set found for table: ${sourceTableName}`);
  }
  
  targetDb.prepare(`
    INSERT OR REPLACE INTO gpkg_tile_matrix_set 
    (table_name, srs_id, min_x, min_y, max_x, max_y)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    targetTableName,
    tileMatrixSet.srs_id,
    tileMatrixSet.min_x,
    tileMatrixSet.min_y,
    tileMatrixSet.max_x,
    tileMatrixSet.max_y
  );
  
  const tileMatrices = sourceDb.prepare(`
    SELECT * FROM gpkg_tile_matrix WHERE table_name = ?
  `).all(sourceTableName);
  
  if (tileMatrices.length === 0) {
    throw new Error(`No tile matrix entries found for table: ${sourceTableName}`);
  }
  
  for (const matrix of tileMatrices) {
    targetDb.prepare(`
      INSERT OR REPLACE INTO gpkg_tile_matrix 
      (table_name, zoom_level, matrix_width, matrix_height, tile_width, tile_height, pixel_x_size, pixel_y_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      targetTableName,
      (matrix as any).zoom_level,
      (matrix as any).matrix_width,
      (matrix as any).matrix_height,
      (matrix as any).tile_width,
      (matrix as any).tile_height,
      (matrix as any).pixel_x_size,
      (matrix as any).pixel_y_size
    );
  }
}

function createTileTable(targetDb: Database.Database, tableName: string, sourceFile1: string, sourceFile2: string): void {
  const createTableSQL = `
    CREATE TABLE "${tableName}" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zoom_level INTEGER NOT NULL,
      tile_column INTEGER NOT NULL,
      tile_row INTEGER NOT NULL,
      tile_data BLOB NOT NULL,
      UNIQUE (zoom_level, tile_column, tile_row)
    )
  `;
  
  targetDb.exec(createTableSQL);
  
  const sourceDb1 = new Database(sourceFile1, { readonly: true });
  const sourceDb2 = new Database(sourceFile2, { readonly: true });
  
  try {
    const tables1 = getDataTables(sourceDb1);
    const tables2 = getDataTables(sourceDb2);
    
    const tileTable1 = tables1.find(table => {
      const columns = getTableColumns(sourceDb1, table.name);
      return columns.some(col => col.name === 'tile_data');
    });
    
    const tileTable2 = tables2.find(table => {
      const columns = getTableColumns(sourceDb2, table.name);
      return columns.some(col => col.name === 'tile_data');
    });
    
    const templateTable = tileTable1 || tileTable2;
    const templateDb = tileTable1 ? sourceDb1 : sourceDb2;
    
    if (!templateTable) {
      throw new Error('No tile tables found for metadata template');
    }
    
    copyTileMetadata(templateDb, targetDb, templateTable.name, tableName);
  } finally {
    sourceDb1.close();
    sourceDb2.close();
  }
}

function mergeTileData(targetDb: Database.Database, targetTable: string, sourceFile: string, sourceName: string, useIgnore: boolean): number {
  const sourceDb = new Database(sourceFile, { readonly: true });
  
  try {
    const sourceTables = getDataTables(sourceDb);
    targetDb.exec(`ATTACH DATABASE '${sourceFile}' AS source_db`);
    
    let totalTiles = 0;
    
    for (const table of sourceTables) {
      const columns = getTableColumns(sourceDb, table.name);
      const isTileTable = columns.some(col => col.name === 'tile_data');
      
      if (!isTileTable) continue;
      
      const insertCommand = useIgnore ? 'INSERT OR IGNORE' : 'INSERT OR REPLACE';
      
      const result = targetDb.prepare(`
        ${insertCommand} INTO "${targetTable}" (zoom_level, tile_column, tile_row, tile_data)
        SELECT zoom_level, tile_column, tile_row, tile_data 
        FROM source_db."${table.name}"
      `).run() as SqlResult;
      
      totalTiles += result.changes;
    }
    
    targetDb.exec('DETACH DATABASE source_db');
    return totalTiles;
  } finally {
    sourceDb.close();
  }
}

function cleanupExistingTables(targetDb: Database.Database): void {
  const existingTables = getDataTables(targetDb);
  for (const table of existingTables) {
    targetDb.exec(`DROP TABLE IF EXISTS "${table.name}"`);
  }
}

function finalizeGeoPackage(targetDb: Database.Database): void {
  targetDb.exec(`PRAGMA application_id = 1196444487`);
  targetDb.exec(`PRAGMA user_version = 10300`);
}

try {
  validateFilesExist(file1, file2);
  
  const file1Name = getFileName(file1);
  const file2Name = getFileName(file2);
  const file1Size = (fs.statSync(file1).size / BYTES_TO_MB).toFixed(2);
  const file2Size = (fs.statSync(file2).size / BYTES_TO_MB).toFixed(2);
  
  console.log(`${file1Name} dataset: ${file1Size} MB, ${file2Name} dataset: ${file2Size} MB`);
  
  const outputFilename = createOutputFilename(file1, file2, args[2]);
  const finalOutputFilename = ensureUniqueOutputFile(outputFilename);
  
  fs.copyFileSync(file1, finalOutputFilename);
  const targetDb = new Database(finalOutputFilename);
  
  try {
    cleanupExistingTables(targetDb);
    createTileTable(targetDb, outputTableName, file1, file2);
    
    console.log(`Merging tiles with ${file2Name} priority strategy...`);
    const merged2 = mergeTileData(targetDb, outputTableName, file2, file2Name, false);
    const merged1 = mergeTileData(targetDb, outputTableName, file1, file1Name, true);
    
    finalizeGeoPackage(targetDb);
    
    const integrityResult = targetDb.prepare('PRAGMA integrity_check').get() as any;
    if ((integrityResult.integrity_check || integrityResult) !== 'ok') {
      throw new Error('Database integrity check failed');
    }
    
    const totalTiles = targetDb.prepare(`SELECT COUNT(*) as count FROM "${outputTableName}"`).get() as CountResult;
    const zoomLevels = targetDb.prepare(`SELECT DISTINCT zoom_level FROM "${outputTableName}" ORDER BY zoom_level`).all() as any[];
    const finalSize = (fs.statSync(finalOutputFilename).size / BYTES_TO_MB).toFixed(2);
    
    console.log(`Merge complete! ${merged2} tiles from ${file2Name}, ${merged1} from ${file1Name} → ${totalTiles.count} total tiles across zoom levels ${zoomLevels.map(z => z.zoom_level).join(', ')} • Output: ${finalOutputFilename} (${finalSize} MB)`);
    
  } finally {
    targetDb.close();
  }

} catch (error: any) {
  console.error(`Failed: ${error.message}`);
  const exitCode = error.status === StatusCodes.BAD_REQUEST ? 1 : 2;
  process.exit(exitCode);
}
