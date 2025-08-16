// Type declarations for AR.js modules
declare module '@ar-js-org/ar.js/three.js/build/ar-threex-location-only' {
  export class ArToolkitSource {
    constructor(parameters: {
      sourceType: string;
      sourceUrl?: string;
      sourceWidth?: number;
      sourceHeight?: number;
    });
    
    ready: boolean;
    domElement: HTMLElement;
    
    init(onCompleted?: () => void, onError?: (error: any) => void): void;
    onResize(): void;
  }

  export class ArToolkitContext {
    constructor(parameters: {
      cameraParametersUrl?: string;
      detectionMode?: string;
      maxDetectionRate?: number;
      canvasWidth?: number;
      canvasHeight?: number;
    });

    update(srcElement: HTMLElement): boolean;
    getProjectionMatrix(): any;
  }

  export class ArMarkerControls {
    constructor(context: ArToolkitContext, markerRoot: any, parameters: {
      type: string;
      patternUrl?: string;
      barcodeValue?: number;
      size?: number;
      minConfidence?: number;
    });
  }

  // Export the main namespace
  const THREEx: {
    ArToolkitSource: typeof ArToolkitSource;
    ArToolkitContext: typeof ArToolkitContext;
    ArMarkerControls: typeof ArMarkerControls;
  };

  export default THREEx;
}

// Type declarations for Three.js (basic types needed for AR.js integration)
declare module 'three' {
  export class Scene {
    add(object: any): void;
  }

  export class Camera {
    // Basic camera properties
  }

  export class WebGLRenderer {
    constructor(parameters?: {
      antialias?: boolean;
      alpha?: boolean;
      canvas?: HTMLCanvasElement;
    });

    domElement: HTMLCanvasElement;
    setClearColor(color: Color, alpha?: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    render(scene: Scene, camera: Camera): void;
  }

  export class Color {
    constructor(color?: string | number);
  }

  export class Group {
    add(object: any): void;
    visible: boolean;
  }

  export class BoxGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }

  export class SphereGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  }

  export class PlaneGeometry {
    constructor(width?: number, height?: number);
  }

  export class MeshBasicMaterial {
    constructor(parameters?: {
      color?: number;
      transparent?: boolean;
      opacity?: number;
      map?: any;
    });
  }

  export class Mesh {
    constructor(geometry: any, material: any);
    position: {
      set(x: number, y: number, z: number): void;
      x: number;
      y: number;
      z: number;
    };
    scale: {
      set(x: number, y: number, z: number): void;
    };
    userData: any;
  }

  export class AnimationMixer {
    constructor(root: any);
    clipAction(clip: any): any;
    update(deltaTime: number): void;
  }

  export class CanvasTexture {
    constructor(canvas: HTMLCanvasElement);
  }

  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (progress: any) => void,
      onError?: (error: any) => void
    ): void;
  }

  // Export the main THREE namespace
  const THREE: {
    Scene: typeof Scene;
    Camera: typeof Camera;
    WebGLRenderer: typeof WebGLRenderer;
    Color: typeof Color;
    Group: typeof Group;
    BoxGeometry: typeof BoxGeometry;
    SphereGeometry: typeof SphereGeometry;
    PlaneGeometry: typeof PlaneGeometry;
    MeshBasicMaterial: typeof MeshBasicMaterial;
    Mesh: typeof Mesh;
    AnimationMixer: typeof AnimationMixer;
    CanvasTexture: typeof CanvasTexture;
    GLTFLoader: typeof GLTFLoader;
  };

  export default THREE;
}
