
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsState, CalculatedData, SourceType } from '../types';

interface Props {
  state: PhysicsState;
  data: CalculatedData;
  isDarkMode: boolean;
  isUiVisible: boolean;
  onPositionChange: (newX: number, newY: number) => void;
}

const SimulationCanvas: React.FC<Props> = ({ state, data, isDarkMode, isUiVisible, onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const magnetRef = useRef<THREE.Group | null>(null);
  const coilRef = useRef<THREE.Group | null>(null);
  const fieldLinesRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Child references for swapping
  const northMeshRef = useRef<THREE.Mesh | null>(null);
  const southMeshRef = useRef<THREE.Mesh | null>(null);

  const [isDraggingMagnet, setIsDraggingMagnet] = useState(false);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane());
  const planeIntersectPoint = useRef(new THREE.Vector3());
  const dragOffset = useRef(new THREE.Vector3());

  const MAGNET_WIDTH = 7;
  const POSITION_SCALE = 0.08; 
  const COIL_PITCH = 0.45; 

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); 
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 60;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x6366f1, 2, 50);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const magnetGroup = new THREE.Group();
    const northGeo = new THREE.BoxGeometry(MAGNET_WIDTH / 2, 1.4, 1.4);
    const northMat = new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 80 });
    const northMesh = new THREE.Mesh(northGeo, northMat);
    northMeshRef.current = northMesh;
    magnetGroup.add(northMesh);

    const southGeo = new THREE.BoxGeometry(MAGNET_WIDTH / 2, 1.4, 1.4);
    const southMat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, shininess: 80 });
    const southMesh = new THREE.Mesh(southGeo, southMat);
    southMeshRef.current = southMesh;
    magnetGroup.add(southMesh);

    magnetRef.current = magnetGroup;
    scene.add(magnetGroup);

    const coilGroup = new THREE.Group();
    coilRef.current = coilGroup;
    scene.add(coilGroup);

    const fieldLinesGroup = new THREE.Group();
    fieldLinesRef.current = fieldLinesGroup;
    scene.add(fieldLinesGroup);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !magnetRef.current || !coilRef.current || !fieldLinesRef.current || !northMeshRef.current || !southMeshRef.current) return;

    magnetRef.current.position.set(
        state.magnetX * POSITION_SCALE,
        state.magnetY * POSITION_SCALE,
        0
    );

    // Swap pole positions based on polarity
    if (state.isReversed) {
      northMeshRef.current.position.x = -MAGNET_WIDTH / 4;
      southMeshRef.current.position.x = MAGNET_WIDTH / 4;
    } else {
      northMeshRef.current.position.x = MAGNET_WIDTH / 4;
      southMeshRef.current.position.x = -MAGNET_WIDTH / 4;
    }

    coilRef.current.clear();
    const coilRadius = 3.2;
    const numTurns = state.turns;
    const points: THREE.Vector3[] = [];
    const segmentsPerTurn = 36;
    const dynamicCoilWidth = numTurns * COIL_PITCH;

    for (let i = 0; i <= numTurns * segmentsPerTurn; i++) {
      const angle = (i / segmentsPerTurn) * Math.PI * 2;
      const x = (i / (numTurns * segmentsPerTurn)) * dynamicCoilWidth - dynamicCoilWidth / 2;
      points.push(new THREE.Vector3(x, Math.sin(angle) * coilRadius, Math.cos(angle) * coilRadius));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, numTurns * 12, 0.2, 8, false);
    
    const inducedColor = data.currentDirection > 0 ? 0xff0000 : 0x0000ff;
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0xcd7f32,
      emissive: Math.abs(data.emf) > 0.05 ? inducedColor : 0x000000,
      emissiveIntensity: Math.min(Math.abs(data.emf) * 1.5, 2.0),
      shininess: 100
    });
    const coilMesh = new THREE.Mesh(tubeGeo, tubeMat);
    coilRef.current.add(coilMesh);

    const termGeo = new THREE.CylinderGeometry(0.08, 0.08, 4);
    const termL = new THREE.Mesh(termGeo, tubeMat);
    termL.position.set(-dynamicCoilWidth / 2, -coilRadius - 2, 0);
    const termR = new THREE.Mesh(termGeo, tubeMat);
    termR.position.set(dynamicCoilWidth / 2, -coilRadius - 2, 0);
    coilRef.current.add(termL, termR);

    fieldLinesRef.current.clear();
    const lineMat = new THREE.LineDashedMaterial({ 
      color: 0x444444, 
      dashSize: 0.25, 
      gapSize: 0.15, 
      transparent: true, 
      opacity: 0.5 
    });
    
    const lineCount = 10;
    for (let j = 0; j < lineCount; j++) {
        const angle = (j / lineCount) * Math.PI * 2;
        const curvePoints = [];
        for (let t = -1; t <= 1; t += 0.1) {
            const r = 3 + Math.abs(t) * 5;
            const x = t * MAGNET_WIDTH * 1.6;
            const y = Math.sin(angle) * r * (1 - Math.pow(Math.abs(t), 2));
            const z = Math.cos(angle) * r * (1 - Math.pow(Math.abs(t), 2));
            curvePoints.push(new THREE.Vector3(x, y, z));
        }
        const fieldCurve = new THREE.CatmullRomCurve3(curvePoints);
        const geo = new THREE.BufferGeometry().setFromPoints(fieldCurve.getPoints(64));
        const line = new THREE.Line(geo, lineMat);
        line.computeLineDistances();
        fieldLinesRef.current.add(line);
    }
    fieldLinesRef.current.position.copy(magnetRef.current.position);

  }, [state.magnetX, state.magnetY, state.isReversed, state.turns, state.fieldStrength, isDarkMode, data.emf, data.currentDirection]);

  const updateMouseCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.sourceType === SourceType.AC_COIL) return;
    updateMouseCoords(e);

    if (cameraRef.current && magnetRef.current) {
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycaster.current.intersectObjects(magnetRef.current.children, true);
      
      if (intersects.length > 0) {
        setIsDraggingMagnet(true);
        if (controlsRef.current) controlsRef.current.enabled = false;

        const normal = new THREE.Vector3();
        cameraRef.current.getWorldDirection(normal);
        normal.negate();
        dragPlane.current.setFromNormalAndCoplanarPoint(normal, magnetRef.current.position);

        if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersectPoint.current)) {
          dragOffset.current.copy(planeIntersectPoint.current).sub(magnetRef.current.position);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    updateMouseCoords(e);
    if (!isDraggingMagnet || !cameraRef.current) return;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersectPoint.current)) {
      const newPos = planeIntersectPoint.current.clone().sub(dragOffset.current);
      const newSimX = newPos.x / POSITION_SCALE;
      const newSimY = newPos.y / POSITION_SCALE;
      onPositionChange(
        Math.max(-200, Math.min(200, newSimX)), 
        Math.max(-100, Math.min(100, newSimY))
      );
    }
  };

  const handleMouseUp = () => {
    setIsDraggingMagnet(false);
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative ${isDraggingMagnet ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div className={`absolute bottom-[30%] sm:bottom-auto sm:top-28 left-4 sm:left-auto sm:right-8 z-10 pointer-events-none text-left sm:text-right transition-all duration-500 ${isUiVisible ? 'opacity-30 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="space-y-0.5 sm:space-y-1 hover:opacity-100 transition-opacity bg-black/20 sm:bg-transparent p-2 rounded-lg">
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/60">Controls</p>
          <p className="text-[9px] sm:text-[11px] font-bold text-gray-400">Drag View : Orbit</p>
          <p className="text-[9px] sm:text-[11px] font-bold text-gray-400">Pinch/Scroll : Zoom</p>
          <p className="text-[9px] sm:text-[11px] font-bold text-gray-400">Grab Magnet : Move 2D</p>
        </div>
      </div>
    </div>
  );
};

export default SimulationCanvas;
