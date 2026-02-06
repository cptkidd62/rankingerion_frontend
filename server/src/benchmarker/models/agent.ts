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
      this.version = name.substring(name.indexOf('#') + 1);
    } else {
      this.baseName = name;
      this.version = null;
    }
  }

  getParamsString(): string {
    let s = '';
    if (this.paramNames.length > 0) {
      s += '@';
      for (let i = 0; i < this.paramNames.length; i++) {
        if (i > 0) s += ';';
        s += this.paramNames[i] + '=' + this.values[i];
      }
    }
    return s;
  }

  toString(): string {
    let s = this.baseName;
    if (this.version != null) {
      s += '#' + this.version;
    }
    s += this.lang;
    s += this.getParamsString();
    return s;
  }

  equals(other: Agent): boolean {
    return (
      this.baseName == other.baseName &&
      this.version == other.version &&
      JSON.stringify(this.paramNames) == JSON.stringify(other.paramNames) &&
      JSON.stringify(this.values) == JSON.stringify(other.values)
    );
  }
}
