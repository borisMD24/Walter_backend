// configStore.js
import { readFile, writeFile } from 'fs/promises';
import { ROOT_DIR } from '../rootPath.js';

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

class DynamicConfigurator {
  constructor(path) {
    this.path = path;
    this._data = null;
    this._loaded = false;
  }

  async read() {
    try {
      const contenu = await readFile(this.path, 'utf8');
      this._data = JSON.parse(contenu);
      this._loaded = true;
      return this._data;
    } catch (err) {
      console.error('📛 Erreur de lecture du fichier de config :', err);
      this._data = {};
      this._loaded = true;
      return this._data;
    }
  }

  async write(keyPath, value) {
    if (!this._loaded) await this.read();

    this._data = this._data || {};
    setDeep(this._data, keyPath, value);

    const json = JSON.stringify(this._data, null, 2);
    await writeFile(this.path, json, 'utf8');

    console.log(`✅ Clé "${keyPath}" mise à jour avec succès`);
  }

  async writeAll(newData) {
    this._data = newData;
    const json = JSON.stringify(this._data, null, 2);
    await writeFile(this.path, json, 'utf8');
    console.log('✨ Données réécrites entièrement');
  }

  async load() {
    if (!this._loaded) {
      await this.read();
    }
    return this._data;
  }

  async reload() {
    return await this.read();
  }

  get data() {
    if (!this._loaded) {
      throw new Error("⚠️ Les données ne sont pas encore chargées. Utilisez await Config.load() d'abord.");
    }
    return this._data;
  }
}

// Singleton exporté proprement
const Config = new DynamicConfigurator(`${ROOT_DIR}/.dynamiconfig.json`);
export default Config;
