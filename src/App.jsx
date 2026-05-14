import React, { useCallback, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Play,
  RefreshCcw,
  Rotate3D,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import FoldScene from "./components/FoldScene.jsx";
import {
  FACE_COLORS,
  FACE_ORDER,
  NETS,
  getFlatBounds,
  getFoldSequence,
  getNetById,
} from "./data/nets.js";

const PHASE_TEXT = {
  flat: "平面展开",
  folding: "正在折叠",
  folded: "已折成立方体",
  unfolding: "正在恢复展开",
  replaying: "正在重播",
};

function MiniNet({ net }) {
  const bounds = getFlatBounds(net);
  const cell = 18;
  const gap = 3;
  const width = (bounds.maxX - bounds.minX + 1) * cell + gap * 2;
  const height = (bounds.maxY - bounds.minY + 1) * cell + gap * 2;

  return (
    <span
      className="mini-net"
      style={{ width, height }}
      aria-hidden="true"
    >
      {FACE_ORDER.map((face) => {
        const coord = net.coords[face];
        const left = (coord.x - bounds.minX) * cell + gap;
        const top = (bounds.maxY - coord.y) * cell + gap;
        return (
          <span
            key={face}
            className="mini-face"
            style={{
              left,
              top,
              background: FACE_COLORS[face],
            }}
          />
        );
      })}
    </span>
  );
}

function FaceLegend({ foldedFaces, activeFace }) {
  return (
    <div className="face-legend" aria-label="面编号图例">
      {FACE_ORDER.map((face) => {
        const isDone = foldedFaces.includes(face);
        const isActive = activeFace === face;
        return (
          <span
            className={`face-chip ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`}
            key={face}
            style={{ "--chip-color": FACE_COLORS[face] }}
          >
            {face}
          </span>
        );
      })}
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState("cross");
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [command, setCommand] = useState(null);
  const [sceneState, setSceneState] = useState({
    phase: "flat",
    activeFace: null,
    foldedFaces: [],
  });

  const selectedNet = useMemo(() => getNetById(selectedId), [selectedId]);
  const foldSequence = useMemo(() => getFoldSequence(selectedNet), [selectedNet]);

  const issueCommand = (action) => {
    setCommand({ action, stamp: performance.now() });
  };

  const selectNet = (id) => {
    setSelectedId(id);
    setCommand(null);
    setSceneState({ phase: "flat", activeFace: null, foldedFaces: [] });
  };

  const handleSceneState = useCallback((nextState) => {
    setSceneState(nextState);
  }, []);

  const activeStepText = sceneState.activeFace
    ? `正在折叠 ${sceneState.activeFace} 面`
    : PHASE_TEXT[sceneState.phase] ?? "准备观察";

  return (
    <main className="app-shell">
      <section className="selector-panel" aria-label="展开图选择区">
        <div className="title-block">
          <div className="title-icon" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div>
            <h1>立方体展开图 3D 折叠演示</h1>
            <p>选择一种展开图，观察它怎样一步步折成立方体。</p>
          </div>
        </div>

        <div className="net-list">
          {NETS.map((net) => (
            <button
              className={`net-card ${selectedId === net.id ? "is-selected" : ""}`}
              key={net.id}
              type="button"
              onClick={() => selectNet(net.id)}
              aria-pressed={selectedId === net.id}
            >
              <MiniNet net={net} />
              <span className="net-card-text">
                <strong>{net.name}</strong>
                <small>{net.badge}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="control-panel">
          <button className="primary-action" type="button" onClick={() => issueCommand("fold")}>
            <Play size={18} />
            开始折叠
          </button>
          <button type="button" onClick={() => issueCommand("replay")}>
            <RefreshCcw size={18} />
            重播动画
          </button>
          <button type="button" onClick={() => issueCommand("unfold")}>
            <RotateCcw size={18} />
            恢复展开
          </button>
          <button
            type="button"
            className={showLabels ? "is-on" : ""}
            onClick={() => setShowLabels((value) => !value)}
            aria-pressed={showLabels}
          >
            {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
            {showLabels ? "隐藏编号" : "显示编号"}
          </button>
          <button
            type="button"
            className={autoRotate ? "is-on" : ""}
            onClick={() => setAutoRotate((value) => !value)}
            aria-pressed={autoRotate}
          >
            <Rotate3D size={18} />
            自动旋转
          </button>
        </div>
      </section>

      <section className="stage-panel" aria-label="3D 演示">
        <div className="stage-toolbar">
          <div>
            <h2>{selectedNet.name}</h2>
            <p>{activeStepText}</p>
          </div>
          <span className={`phase-pill phase-${sceneState.phase}`}>
            {PHASE_TEXT[sceneState.phase] ?? "观察中"}
          </span>
        </div>
        <FoldScene
          net={selectedNet}
          command={command}
          showLabels={showLabels}
          autoRotate={autoRotate}
          onSceneState={handleSceneState}
        />
      </section>

      <aside className="explain-panel" aria-label="讲解面板">
        <div className="panel-section">
          <span className="eyebrow">当前展开图</span>
          <h2>{selectedNet.name}</h2>
          <p>{selectedNet.description}</p>
        </div>

        <div className="panel-section">
          <span className="eyebrow">观察提示</span>
          <p>{selectedNet.observe}</p>
        </div>

        <div className="panel-section">
          <span className="eyebrow">折叠步骤</span>
          <ol className="step-list">
            {selectedNet.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="panel-section">
          <span className="eyebrow">动画顺序</span>
          <FaceLegend
            activeFace={sceneState.activeFace}
            foldedFaces={sceneState.foldedFaces}
          />
          <p className="sequence-text">
            {selectedNet.root} 面固定，随后依次折起：{foldSequence.join(" → ")}
          </p>
        </div>
      </aside>
    </main>
  );
}
