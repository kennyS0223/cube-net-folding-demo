import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  FACE_COLORS,
  FACE_ORDER,
  getChildrenMap,
  getFlatBounds,
  getFoldSequence,
} from "../data/nets.js";

const FACE_SIZE = 1.08;
const FOLD_DURATION = 620;
const UNFOLD_DURATION = 460;

function createLabelTexture(letter) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  roundRect(ctx, 42, 42, 172, 172, 36);
  ctx.fill();
  ctx.strokeStyle = "rgba(20, 44, 64, 0.18)";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = "#17324d";
  ctx.font = "800 126px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 128, 136);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function getDirection(net, parent, child) {
  const parentCoord = net.coords[parent];
  const childCoord = net.coords[child];
  const dx = childCoord.x - parentCoord.x;
  const dy = childCoord.y - parentCoord.y;

  if (dx === 1 && dy === 0) return "right";
  if (dx === -1 && dy === 0) return "left";
  if (dx === 0 && dy === 1) return "up";
  if (dx === 0 && dy === -1) return "down";

  throw new Error(`面 ${child} 必须与父面 ${parent} 共享一条边`);
}

function getFoldSpec(direction) {
  const half = FACE_SIZE / 2;

  if (direction === "right") {
    return {
      axis: "y",
      targetAngle: Math.PI / 2,
      hinge: new THREE.Vector3(half, 0, 0),
      childOffset: new THREE.Vector3(half, 0, 0),
    };
  }

  if (direction === "left") {
    return {
      axis: "y",
      targetAngle: -Math.PI / 2,
      hinge: new THREE.Vector3(-half, 0, 0),
      childOffset: new THREE.Vector3(-half, 0, 0),
    };
  }

  if (direction === "up") {
    return {
      axis: "x",
      targetAngle: -Math.PI / 2,
      hinge: new THREE.Vector3(0, half, 0),
      childOffset: new THREE.Vector3(0, half, 0),
    };
  }

  return {
    axis: "x",
    targetAngle: Math.PI / 2,
    hinge: new THREE.Vector3(0, -half, 0),
    childOffset: new THREE.Vector3(0, -half, 0),
  };
}

function createFace(faceId, showLabels) {
  const group = new THREE.Group();
  group.name = `face-${faceId}`;

  const geometry = new THREE.PlaneGeometry(FACE_SIZE, FACE_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color: FACE_COLORS[faceId],
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  group.add(mesh);

  const edgeGeometry = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: "#17324d",
    transparent: true,
    opacity: 0.34,
  });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edges.position.z = 0.012;
  group.add(edges);

  const labelTexture = createLabelTexture(faceId);
  const labelGeometry = new THREE.PlaneGeometry(FACE_SIZE * 0.42, FACE_SIZE * 0.42);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.z = 0.035;
  label.visible = showLabels;
  group.add(label);

  group.userData.label = label;
  return group;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
      });
    }
  });
}

function createNetModel(net, showLabels) {
  const model = new THREE.Group();
  const children = getChildrenMap(net);
  const pivots = {};
  const faceGroups = {};

  const rootFace = createFace(net.root, showLabels);
  model.add(rootFace);
  faceGroups[net.root] = rootFace;

  function attachChildren(parentId, parentGroup) {
    children[parentId].forEach((childId) => {
      const direction = getDirection(net, parentId, childId);
      const spec = getFoldSpec(direction);

      const pivot = new THREE.Group();
      pivot.position.copy(spec.hinge);
      pivot.userData = {
        faceId: childId,
        axis: spec.axis,
        targetAngle: spec.targetAngle,
      };
      parentGroup.add(pivot);

      const childFace = createFace(childId, showLabels);
      childFace.position.copy(spec.childOffset);
      pivot.add(childFace);

      pivots[childId] = pivot;
      faceGroups[childId] = childFace;
      attachChildren(childId, childFace);
    });
  }

  attachChildren(net.root, rootFace);

  const bounds = getFlatBounds(net);
  const rootCoord = net.coords[net.root];
  const centerX = (bounds.minX + bounds.maxX) / 2 - rootCoord.x;
  const centerY = (bounds.minY + bounds.maxY) / 2 - rootCoord.y;
  model.position.set(-centerX * FACE_SIZE, -centerY * FACE_SIZE, 0);

  return { model, pivots, faceGroups };
}

function getCameraDistance(net) {
  const bounds = getFlatBounds(net);
  const cellsWide = bounds.maxX - bounds.minX + 1;
  const cellsHigh = bounds.maxY - bounds.minY + 1;
  return Math.max(4.85, Math.max(cellsWide, cellsHigh) * 1.28);
}

function animateValue({ from, to, duration, onUpdate, token }) {
  return new Promise((resolve) => {
    const startedAt = performance.now();

    function tick(now) {
      if (token.cancelled) {
        resolve(false);
        return;
      }

      const time = Math.min(1, (now - startedAt) / duration);
      const eased = time < 0.5 ? 2 * time * time : 1 - Math.pow(-2 * time + 2, 2) / 2;
      onUpdate(from + (to - from) * eased);

      if (time < 1) {
        requestAnimationFrame(tick);
      } else {
        onUpdate(to);
        resolve(true);
      }
    }

    requestAnimationFrame(tick);
  });
}

export default function FoldScene({
  net,
  command,
  showLabels,
  autoRotate,
  onSceneState,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const pivotsRef = useRef({});
  const faceGroupsRef = useRef({});
  const progressRef = useRef({});
  const animationTokenRef = useRef(null);
  const onSceneStateRef = useRef(onSceneState);

  useEffect(() => {
    onSceneStateRef.current = onSceneState;
  }, [onSceneState]);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fcff");

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.6;
    controls.maxDistance = 13;
    controls.enablePan = false;
    controls.autoRotateSpeed = 1.15;

    const ambient = new THREE.HemisphereLight("#ffffff", "#bdd7ee", 2.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#ffffff", 2.8);
    keyLight.position.set(4, -5, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#fff5d6", 1.1);
    fillLight.position.set(-5, 4, 4);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.25, 80),
      new THREE.MeshBasicMaterial({
        color: "#e7f3ff",
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    floor.position.z = -0.055;
    scene.add(floor);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    function resize() {
      const { clientWidth, clientHeight } = mount;
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    }

    function render() {
      Object.entries(pivotsRef.current).forEach(([faceId, pivot]) => {
        const progress = progressRef.current[faceId] ?? 0;
        const axis = pivot.userData.axis;
        pivot.rotation.set(0, 0, 0);
        pivot.rotation[axis] = pivot.userData.targetAngle * progress;
      });

      controls.autoRotate = autoRotate;
      controls.update();
      renderer.render(scene, camera);
      sceneRef.current.userData.frameId = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(scene.userData.frameId);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    if (animationTokenRef.current) {
      animationTokenRef.current.cancelled = true;
    }

    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeObject(modelRef.current);
    }

    const { model, pivots, faceGroups } = createNetModel(net, showLabels);
    scene.add(model);
    modelRef.current = model;
    pivotsRef.current = pivots;
    faceGroupsRef.current = faceGroups;
    progressRef.current = Object.fromEntries(FACE_ORDER.map((face) => [face, 0]));

    const distance = getCameraDistance(net);
    camera.position.set(distance * 0.72, -distance * 1.08, distance * 0.78);
    controls.target.set(0, 0, -0.24);
    controls.update();

    onSceneStateRef.current?.({
      phase: "flat",
      activeFace: null,
      foldedFaces: [],
    });
  }, [net, showLabels]);

  useEffect(() => {
    Object.values(faceGroupsRef.current).forEach((faceGroup) => {
      if (faceGroup.userData.label) {
        faceGroup.userData.label.visible = showLabels;
      }
    });
  }, [showLabels]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (!command) return;

    const sequence = getFoldSequence(net);
    const token = { cancelled: false };

    if (animationTokenRef.current) {
      animationTokenRef.current.cancelled = true;
    }
    animationTokenRef.current = token;

    async function fold() {
      onSceneStateRef.current?.({
        phase: command.action === "replay" ? "replaying" : "folding",
        activeFace: null,
        foldedFaces: sequence.filter((face) => (progressRef.current[face] ?? 0) >= 0.99),
      });

      if (command.action === "replay") {
        sequence.forEach((face) => {
          progressRef.current[face] = 0;
        });
      }

      for (const face of sequence) {
        if (token.cancelled) return;
        const from = progressRef.current[face] ?? 0;
        if (from >= 0.99) continue;

        onSceneStateRef.current?.({
          phase: "folding",
          activeFace: face,
          foldedFaces: sequence.filter((item) => (progressRef.current[item] ?? 0) >= 0.99),
        });

        const ok = await animateValue({
          from,
          to: 1,
          duration: FOLD_DURATION,
          token,
          onUpdate: (value) => {
            progressRef.current[face] = value;
          },
        });
        if (!ok) return;
      }

      onSceneStateRef.current?.({
        phase: "folded",
        activeFace: null,
        foldedFaces: [...sequence],
      });
    }

    async function unfold() {
      const reverse = [...sequence].reverse();

      for (const face of reverse) {
        if (token.cancelled) return;
        const from = progressRef.current[face] ?? 0;
        if (from <= 0.01) continue;

        onSceneStateRef.current?.({
          phase: "unfolding",
          activeFace: face,
          foldedFaces: sequence.filter((item) => (progressRef.current[item] ?? 0) >= 0.99),
        });

        const ok = await animateValue({
          from,
          to: 0,
          duration: UNFOLD_DURATION,
          token,
          onUpdate: (value) => {
            progressRef.current[face] = value;
          },
        });
        if (!ok) return;
      }

      onSceneStateRef.current?.({
        phase: "flat",
        activeFace: null,
        foldedFaces: [],
      });
    }

    if (command.action === "unfold") {
      unfold();
    } else {
      fold();
    }

    return () => {
      token.cancelled = true;
    };
  }, [command, net]);

  return <div ref={mountRef} className="fold-scene" aria-label="3D 折叠演示区" />;
}
