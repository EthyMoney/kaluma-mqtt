class SimpleBuffer {
  constructor(initialData = []) {
    this.data = initialData;
  }

  static from(string, encoding = 'utf8') {
    if (encoding !== 'utf8') {
      throw new Error("Only 'utf8' encoding is supported.");
    }
    const bytes = [];
    for (let i = 0; i < string.length; i++) {
      const charCode = string.charCodeAt(i);
      bytes.push(charCode);
    }
    return new SimpleBuffer(bytes);
  }

  concat(otherBuffer) {
    this.data = this.data.concat(otherBuffer.data);
    return this;
  }

  writeUInt8(value, offset) {
    this.data[offset] = value;
  }

  writeUInt16BE(value, offset) {
    this.data[offset] = (value & 0xFF00) >> 8;
    this.data[offset + 1] = value & 0xFF;
  }

  toBuffer() {
    return this.data;
  }

  get length() {
    return this.data.length;
  }
}

export default SimpleBuffer;
