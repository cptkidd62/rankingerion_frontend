export class Agent {
  baseName: string;
  version: string | null;
  lang: string;
  paramNames: string[];
  values: number[];

  constructor(def: string) {
    if (def.startsWith('$')) {
      this.baseName = def;
      this.version = null;
      this.paramNames = [];
      this.values = [];
      this.lang = '';
      return;
    }
    let name: string = '';
    if (!def.includes('@')) {
      name = def;
      this.paramNames = [];
      this.values = [];
    } else {
      name = def.substring(0, def.indexOf('@'));
      const paramDefs = def.substring(def.indexOf('@') + 1).split(';');
      paramDefs.forEach((element) => {
        this.paramNames.push(element.substring(0, element.indexOf('=')).trim());
        this.values.push(
          Number(element.substring(element.indexOf('=') + 1).trim()),
        );
      });
    }
    if (name.includes('.')) {
      this.lang = name.substring(name.indexOf('.'));
      name = name.substring(0, name.indexOf('.'));
    } else {
      this.lang = '.cpp';
    }
    if (name.includes('#')) {
      this.baseName = name.substring(0, name.indexOf('#'));
      this.version = name.substring(name.indexOf('#'));
    } else {
      this.baseName = name;
      this.version = null;
    }
  }
}
