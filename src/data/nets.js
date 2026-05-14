export const FACE_ORDER = ["A", "B", "C", "D", "E", "F"];

export const FACE_COLORS = {
  A: "#ff6b6b",
  B: "#ffd166",
  C: "#3ddc97",
  D: "#4dabf7",
  E: "#b197fc",
  F: "#ff9f1c",
};

export const NETS = [
  {
    id: "cross",
    name: "十字型",
    badge: "经典",
    root: "A",
    coords: {
      A: { x: 0, y: 0 },
      B: { x: -1, y: 0 },
      C: { x: 1, y: 0 },
      D: { x: 0, y: 1 },
      E: { x: 0, y: -1 },
      F: { x: 0, y: -2 },
    },
    parents: { B: "A", C: "A", D: "A", E: "A", F: "E" },
    foldOrder: ["B", "C", "D", "E", "F"],
    description:
      "十字型以 A 面为中心，B、C、D、E 四个面围在四周，F 面接在 E 面下面。",
    observe:
      "观察 B、C、D、E 像四扇小门一样围起来，F 面最后会成为 A 面的相对面。",
    steps: [
      "A 面保持在原位，作为折叠的中心面。",
      "B、C、D、E 依次沿公共边折起 90 度。",
      "F 面跟随 E 面翻起，盖到 A 面的对面。",
    ],
  },
  {
    id: "line-four",
    name: "一字四连型",
    badge: "长条",
    root: "B",
    coords: {
      A: { x: 0, y: 0 },
      B: { x: 1, y: 0 },
      C: { x: 2, y: 0 },
      D: { x: 3, y: 0 },
      E: { x: 1, y: 1 },
      F: { x: 1, y: -1 },
    },
    parents: { A: "B", C: "B", D: "C", E: "B", F: "B" },
    foldOrder: ["A", "C", "D", "E", "F"],
    description:
      "一字四连型有 A、B、C、D 四个面排成一行，E、F 分别连在 B 面上下。",
    observe:
      "先把长条看成绕立方体一圈的侧面，再看 E、F 分别补上剩下的两个面。",
    steps: [
      "B 面先固定，A、C 从左右两边折起。",
      "D 面接着沿 C 面继续折起，绕到 B 面的对面。",
      "E、F 从上下两边折起，补成立方体。",
    ],
  },
  {
    id: "t-shape",
    name: "T 字型",
    badge: "分支",
    root: "D",
    coords: {
      A: { x: -1, y: 1 },
      B: { x: 0, y: 1 },
      C: { x: 1, y: 1 },
      D: { x: 0, y: 0 },
      E: { x: 0, y: -1 },
      F: { x: 0, y: -2 },
    },
    parents: { B: "D", A: "B", C: "B", E: "D", F: "E" },
    foldOrder: ["B", "E", "A", "C", "F"],
    description:
      "T 字型上方有 A、B、C 三个面横排，D、E、F 从中间向下连接。",
    observe:
      "注意 B 面先立起后，A 和 C 会像左右两扇门一样继续折向两侧。",
    steps: [
      "D 面保持平放，B、E 沿上下边折起。",
      "A、C 接在 B 面左右两侧，继续折起。",
      "F 面接在 E 面下方，最后翻到对面。",
    ],
  },
  {
    id: "stair",
    name: "阶梯型",
    badge: "台阶",
    root: "C",
    coords: {
      A: { x: 0, y: 0 },
      B: { x: 1, y: 0 },
      C: { x: 1, y: 1 },
      D: { x: 2, y: 1 },
      E: { x: 2, y: 2 },
      F: { x: 3, y: 2 },
    },
    parents: { B: "C", A: "B", D: "C", E: "D", F: "E" },
    foldOrder: ["B", "D", "A", "E", "F"],
    description:
      "阶梯型像向右上方走的台阶，每两个相邻面共享一条边。",
    observe:
      "从 C 面出发，左右两条折叠路线会逐步围成立方体的六个方向。",
    steps: [
      "C 面固定，B、D 先分别折起。",
      "A 接在 B 面外侧，E 接在 D 面上方，继续折起。",
      "F 沿 E 面折起，完成最后一个面。",
    ],
  },
  {
    id: "z-shape",
    name: "Z 字型",
    badge: "转折",
    root: "D",
    coords: {
      A: { x: 0, y: 1 },
      B: { x: 1, y: 1 },
      C: { x: 1, y: 0 },
      D: { x: 2, y: 0 },
      E: { x: 2, y: -1 },
      F: { x: 3, y: -1 },
    },
    parents: { C: "D", B: "C", A: "B", E: "D", F: "E" },
    foldOrder: ["C", "E", "B", "F", "A"],
    description:
      "Z 字型由三段短横排组成，中间不断转折，整体看起来像一个 Z。",
    observe:
      "观察折叠时方向会左右交替变化，但每一步仍然只绕一条公共边转动。",
    steps: [
      "D 面固定，C、E 先从左右两条边折起。",
      "B 接在 C 面上方，F 接在 E 面右侧，继续折起。",
      "A 沿 B 面折起，完成最后的闭合。",
    ],
  },
];

export function getNetById(id) {
  return NETS.find((net) => net.id === id) ?? NETS[0];
}

export function getChildrenMap(net) {
  const children = Object.fromEntries(FACE_ORDER.map((face) => [face, []]));

  Object.entries(net.parents).forEach(([child, parent]) => {
    children[parent].push(child);
  });

  Object.values(children).forEach((items) => {
    items.sort((a, b) => FACE_ORDER.indexOf(a) - FACE_ORDER.indexOf(b));
  });

  return children;
}

export function getFoldSequence(net) {
  if (Array.isArray(net.foldOrder)) {
    return net.foldOrder;
  }

  const children = getChildrenMap(net);
  const queue = [...children[net.root]];
  const sequence = [];

  while (queue.length > 0) {
    const face = queue.shift();
    sequence.push(face);
    queue.push(...children[face]);
  }

  return sequence;
}

export function getFlatBounds(net) {
  const values = Object.values(net.coords);
  const xs = values.map((item) => item.x);
  const ys = values.map((item) => item.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

