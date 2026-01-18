import * as fs from 'fs/promises';
import * as path from 'path';
import { watch, FSWatcher } from 'chokidar';

export class FileSystemService {
  private watchers: Map<string, FSWatcher> = new Map();

  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async createFile(filePath: string): Promise<void> {
    try {
      // Check if file already exists
      try {
        await fs.access(filePath);
        throw new Error(`File already exists: ${filePath}`);
      } catch (error) {
        // File doesn't exist, proceed with creation
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, '', 'utf-8');
    } catch (error) {
      console.error(`Error creating file ${filePath}:`, error);
      throw new Error(`Failed to create file: ${filePath}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      throw new Error(`Failed to delete file: ${filePath}`);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      // Ensure target directory exists
      const dir = path.dirname(newPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.rename(oldPath, newPath);
    } catch (error) {
      console.error(`Error renaming file from ${oldPath} to ${newPath}:`, error);
      throw new Error(`Failed to rename file: ${oldPath} -> ${newPath}`);
    }
  }

  async watchDirectory(dirPath: string): Promise<void> {
    try {
      // Stop existing watcher if any
      if (this.watchers.has(dirPath)) {
        await this.watchers.get(dirPath)?.close();
      }

      // Create new watcher
      const watcher = watch(dirPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true
      });

      watcher
        .on('add', (filePath) => {
          console.log(`File added: ${filePath}`);
          // TODO: Emit to renderer process
        })
        .on('change', (filePath) => {
          console.log(`File changed: ${filePath}`);
          // TODO: Emit to renderer process
        })
        .on('unlink', (filePath) => {
          console.log(`File removed: ${filePath}`);
          // TODO: Emit to renderer process
        })
        .on('error', (error) => {
          console.error('File watcher error:', error);
        });

      this.watchers.set(dirPath, watcher);
    } catch (error) {
      console.error(`Error watching directory ${dirPath}:`, error);
      throw new Error(`Failed to watch directory: ${dirPath}`);
    }
  }

  async stopWatching(dirPath: string): Promise<void> {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(dirPath);
    }
  }

  async stopAllWatchers(): Promise<void> {
    for (const [dirPath, watcher] of this.watchers) {
      await watcher.close();
    }
    this.watchers.clear();
  }
}