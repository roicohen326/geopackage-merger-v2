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

interface FileInfo {
  path: string;
  name: string;
  size: string;
  priority: boolean;
}

const BYTES_TO_MB = 1024 * 1024;

export function checkFileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

export function validateFilesExist(file1Path: string, file2Path: string): void {
  const files = [file1Path, file2Path];
  const existsResults = files.map(checkFileExists);
  
  if (!existsResults.every(exists => exists)) {
    const missingFiles = files.filter((_, index) => !existsResults[index]);
    throw new Error(`Missing file(s): ${missingFiles.join(', ')}`);
  }
}

export function getFileName(filepath: string): string {
  return path.basename(filepath, path.extname(filepath));
}

export function getFileSize(filepath: string): string {
  return (fs.statSync(filepath).size / BYTES_TO_MB).toFixed(2);
}

export function processFileInfo(filepath: string, priority: boolean): FileInfo {
  return {
    path: filepath,
    name: getFileName(filepath),
    size: getFileSize(filepath),
    priority: priority
  };
}

export function createOutputFilename(file1Path: string, file2Path: string, customOutput?: string): string {
  if (customOutput) return customOutput;
  
  const fileNames = [file1Path, file2Path].map(getFileName);
  return `merged_${fileNames.join('_')}.gpkg`;
}

export function ensureUniqueOutputFile(outputFilename: string): string {
  if (!fs.existsSync(outputFilename)) return outputFilename;
  
  const ext = path.extname(outputFilename);
  const nameWithoutExt = outputFilename.replace(ext, '');
  const uniqueFilename = `${nameWithoutExt}_${Date.now()}${ext}`;
  
  console.log(`Output file exists, creating: ${uniqueFilename}`);
  return uniqueFilename;
}

export function getDataTables(database: Database.Database): TableInfo[] {
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

export function getTableColumns(database: Database.Database, tableName: string): ColumnInfo[] {
  return database.prepare(`PRAGMA table_info("${tableName}")`).all() as ColumnInfo[];
}

export function findTileTable(database: Database.Database): TableInfo | null {
  const tables = getDataTables(database);
  return tables.find(table => {
    const columns = getTableColumns(database, table.name);
    return columns.some(col => col.name === 'tile_data');
  }) || null;
}

export function openDatabase(filepath: string): Database.Database {
  return new Database(filepath, { readonly: true });
}

export function copyTileMetadata(sourceDb: Database.Database, targetDb: Database.Database, sourceTableName: string, targetTableName: string): void {
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

export function createTileTable(targetDb: Database.Database, tableName: string, sourceFile1: string, sourceFile2: string): void {
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
  
  const sourceFiles = [sourceFile1, sourceFile2];
  const databases = sourceFiles.map(openDatabase);
  
  try {
    const tileTables = databases.map(findTileTable);
    const templateIndex = tileTables.findIndex(table => table !== null);
    
    if (templateIndex === -1) {
      throw new Error('No tile tables found for metadata template');
    }
    
    const templateDb = databases[templateIndex];
    const templateTable = tileTables[templateIndex]!;
    
    copyTileMetadata(templateDb, targetDb, templateTable.name, tableName);
  } finally {
    databases.forEach(db => db.close());
  }
}

export function mergeTileData(targetDb: Database.Database, targetTable: string, sourceFile: string, sourceName: string, useIgnore: boolean): number {
  const sourceDb = openDatabase(sourceFile);
  
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

if (require.main === module) {
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

  try {
    validateFilesExist(file1, file2);
    
    const fileInfos = [
      processFileInfo(file1, true),
      processFileInfo(file2, false)
    ];
    
    console.log(`${fileInfos[0].name} dataset: ${fileInfos[0].size} MB, ${fileInfos[1].name} dataset: ${fileInfos[1].size} MB`);
    
    const outputFilename = createOutputFilename(file1, file2, args[2]);
    const finalOutputFilename = ensureUniqueOutputFile(outputFilename);
    
    fs.copyFileSync(file1, finalOutputFilename);
    const targetDb = new Database(finalOutputFilename);
    
    try {
      cleanupExistingTables(targetDb);
      createTileTable(targetDb, outputTableName, file1, file2);
      
      console.log(`Merging tiles with ${fileInfos[1].name} priority strategy...`);
      const mergeResults = fileInfos.map(fileInfo => 
        mergeTileData(targetDb, outputTableName, fileInfo.path, fileInfo.name, fileInfo.priority)
      );
      
      finalizeGeoPackage(targetDb);
      
      const integrityResult = targetDb.prepare('PRAGMA integrity_check').get() as any;
      if ((integrityResult.integrity_check || integrityResult) !== 'ok') {
        throw new Error('Database integrity check failed');
      }
      
      const totalTiles = targetDb.prepare(`SELECT COUNT(*) as count FROM "${outputTableName}"`).get() as CountResult;
      const zoomLevels = targetDb.prepare(`SELECT DISTINCT zoom_level FROM "${outputTableName}" ORDER BY zoom_level`).all() as any[];
      const finalSize = getFileSize(finalOutputFilename);
      
      console.log(`Merge complete! ${mergeResults[1]} tiles from ${fileInfos[1].name}, ${mergeResults[0]} from ${fileInfos[0].name} → ${totalTiles.count} total tiles across zoom levels ${zoomLevels.map(z => z.zoom_level).join(', ')} • Output: ${finalOutputFilename} (${finalSize} MB)`);
      
    } finally {
      targetDb.close();
    }

  } catch (error: any) {
    console.error(`Failed: ${error.message}`);
    const exitCode = error.status === StatusCodes.BAD_REQUEST ? 1 : 2;
    process.exit(exitCode);
  }
}