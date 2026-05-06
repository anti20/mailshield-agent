import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export function openDatabase(databasePath: string): Database.Database {
  try {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });

    const database = new Database(databasePath);
    database.pragma("foreign_keys = ON");

    return database;
  } catch (error) {
    throw new Error(`Failed to open SQLite database at ${databasePath}.`, {
      cause: error
    });
  }
}
