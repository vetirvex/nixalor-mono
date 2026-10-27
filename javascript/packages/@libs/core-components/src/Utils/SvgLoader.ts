class SvgLoader {
  private svgCache: Map<string, string>;

  constructor() {
    this.svgCache = new Map();
  }

  getSvg(svgPath: string): string | undefined {
    return this.svgCache.get(svgPath);
  }

  async loadSvg(svgPath: string): Promise<string> {
    const res = await fetch(svgPath);
    if (!res.ok) {
      throw new Error("Cannot");
    }
    return res.text();
  }

  subscribe(svgPath: string, subscriber: (svgData: string) => void): void {
    const cachedData = this.svgCache.get(svgPath);
    if (cachedData) {
      subscriber(cachedData);
    } else {
      this.loadSvg(svgPath).then((data) => {
        this.svgCache.set(svgPath, data);
        subscriber(data);
      });
    }
  }
}

const svgLoader = new SvgLoader();

export { svgLoader };
