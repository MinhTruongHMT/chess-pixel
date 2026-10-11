import Phaser from 'phaser';
import { Chess, type Square } from 'chess.js';
import { PIECES, palette } from '../pieces';
import type { Settings } from '../../types';
import type { GameSnapshot } from '../../chess/ChessSession';

const CELL = 64;
export const MARGIN = 28;
export const SIZE = CELL * 8 + MARGIN * 2;
const THEMES = {
  caramel: [0xfff1c9, 0xc18a61], forest: [0xeff5d7, 0x7fa776], lavender: [0xf0e6ff, 0xa592c0],
};

export interface BoardModel {
  game: GameSnapshot;
  selected: Square | null;
  legal: Square[];
  settings: Settings;
  flipped: boolean;
  enabled: boolean;
}

export class BoardScene extends Phaser.Scene {
  private tiles!: Phaser.GameObjects.Graphics;
  private sprites = new Map<Square, Phaser.GameObjects.Image>();
  private model: BoardModel | null = null;
  private renderedFen = '';
  private renderedFlip = false;
  private drag: { from: Square; sprite: Phaser.GameObjects.Image; moved: boolean; x: number; y: number } | null = null;
  private labels: Phaser.GameObjects.Text[] = [];
  onSquare: (from: Square | null, to: Square) => void = () => {};
  onReady: () => void = () => {};

  constructor() { super('ChessBoard'); }

  create() {
    this.tiles = this.add.graphics();
    for (const color of ['w', 'b'] as const) {
      for (const [type, rows] of Object.entries(PIECES)) {
        const texture = this.textures.createCanvas(`${color}${type}`, 48, 60);
        if (!texture) continue;
        const ctx = texture.context;
        const colors = palette(color);
        rows.forEach((row, y) => [...row].forEach((pixel, x) => {
          if (colors[pixel]) { ctx.fillStyle = colors[pixel]; ctx.fillRect(x * 3, y * 3, 3, 3); }
        }));
        texture.refresh();
      }
    }
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.model?.enabled) return;
      const square = this.squareAt(pointer.x, pointer.y);
      if (!square) return;
      const sprite = this.sprites.get(square);
      if (sprite && new Chess(this.model.game.fen).get(square)?.color === this.model.game.turn) {
        this.tweens.killTweensOf(sprite);
        this.drag = { from: square, sprite, moved: false, x: pointer.x, y: pointer.y };
        sprite.setDepth(10);
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.drag || !pointer.isDown) return;
      if (Math.hypot(pointer.x - this.drag.x, pointer.y - this.drag.y) > 8) this.drag.moved = true;
      if (this.drag.moved) this.drag.sprite.setPosition(pointer.x, pointer.y);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.model?.enabled) { this.resetDrag(); return; }
      const to = this.squareAt(pointer.x, pointer.y);
      const from = this.drag?.moved ? this.drag.from : null;
      this.resetDrag();
      if (to) this.onSquare(from, to);
    });
    this.input.on('pointerupoutside', () => this.resetDrag());
    this.game.canvas.addEventListener('pointercancel', this.cancelDrag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.canvas.removeEventListener('pointercancel', this.cancelDrag);
    });
    if (this.model) this.render(this.model);
    this.onReady();
  }

  private cancelDrag = () => this.resetDrag();
  private resetDrag() {
    if (this.drag) {
      const { x, y } = this.position(this.drag.from);
      this.drag.sprite.setPosition(x, y).setDepth(2);
      this.drag = null;
    }
  }

  private position(square: Square) {
    let col = square.charCodeAt(0) - 97;
    let row = 8 - Number(square[1]);
    if (this.model?.flipped) { col = 7 - col; row = 7 - row; }
    return { x: MARGIN + col * CELL + CELL / 2, y: MARGIN + row * CELL + CELL / 2 };
  }

  private squareAt(x: number, y: number): Square | null {
    let col = Math.floor((x - MARGIN) / CELL);
    let row = Math.floor((y - MARGIN) / CELL);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    if (this.model?.flipped) { col = 7 - col; row = 7 - row; }
    return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
  }

  render(model: BoardModel) {
    this.model = model;
    if (!this.tiles) return;
    if (!model.enabled) this.resetDrag();
    const chess = new Chess(model.game.fen);
    const colors = THEMES[model.settings.theme];
    this.tiles.clear().fillStyle(0x8c624a).fillRect(0, 0, SIZE, SIZE);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const x = MARGIN + col * CELL, y = MARGIN + row * CELL;
      this.tiles.fillStyle(colors[(row + col) % 2]).fillRect(x, y, CELL, CELL);
    }
    const highlight = (square: Square, color: number, alpha: number) => {
      const p = this.position(square);
      this.tiles.fillStyle(color, alpha).fillRect(p.x - CELL / 2, p.y - CELL / 2, CELL, CELL);
    };
    if (model.game.lastMove) {
      highlight(model.game.lastMove.from, 0xffd966, 0.45);
      highlight(model.game.lastMove.to, 0xffd966, 0.55);
    }
    if (chess.isCheck()) {
      const king = chess.board().flat().find((piece) => piece?.type === 'k' && piece.color === chess.turn());
      if (king) highlight(king.square, 0xff526b, 0.72);
    }
    if (model.selected) highlight(model.selected, 0x7ed957, 0.65);
    for (const square of model.legal) {
      const p = this.position(square);
      if (chess.get(square)) this.tiles.lineStyle(5, 0x4d7955, 0.8).strokeCircle(p.x, p.y, 28);
      else this.tiles.fillStyle(0x466d52, 0.55).fillCircle(p.x, p.y, 8);
    }
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    for (let i = 0; i < 8; i++) {
      const file = String.fromCharCode(97 + (model.flipped ? 7 - i : i));
      const rank = String(model.flipped ? i + 1 : 8 - i);
      const style = { fontFamily: 'monospace', fontSize: '14px', color: '#fff1c9', fontStyle: 'bold' };
      this.labels.push(this.add.text(MARGIN + i * CELL + CELL / 2, SIZE - 14, file, style).setOrigin(0.5));
      this.labels.push(this.add.text(14, MARGIN + i * CELL + CELL / 2, rank, style).setOrigin(0.5));
    }
    if (model.game.fen === this.renderedFen && model.flipped === this.renderedFlip) return;
    this.resetDrag();
    const animate = model.settings.animation && this.renderedFen === model.game.lastMove?.before && model.flipped === this.renderedFlip;
    this.tweens.killAll();
    this.sprites.forEach((sprite) => sprite.destroy());
    this.sprites.clear();
    for (const piece of chess.board().flat()) {
      if (!piece) continue;
      const position = this.position(piece.square);
      const sprite = this.add.image(position.x, position.y, `${piece.color}${piece.type}`).setDepth(2);
      this.sprites.set(piece.square, sprite);
      if (animate && piece.square === model.game.lastMove?.to) {
        const from = this.position(model.game.lastMove.from);
        sprite.setPosition(from.x, from.y);
        this.tweens.add({ targets: sprite, x: position.x, y: position.y, duration: 190, ease: 'Quad.easeOut' });
      }
      if (animate && model.game.lastMove?.flags.includes('k') && piece.type === 'r' && piece.square[0] === 'f') {
        sprite.setPosition(this.position(`h${piece.square[1]}` as Square).x, position.y);
        this.tweens.add({ targets: sprite, x: position.x, duration: 190 });
      }
      if (animate && model.game.lastMove?.flags.includes('q') && piece.type === 'r' && piece.square[0] === 'd') {
        sprite.setPosition(this.position(`a${piece.square[1]}` as Square).x, position.y);
        this.tweens.add({ targets: sprite, x: position.x, duration: 190 });
      }
    }
    if (animate && (model.game.lastMove?.captured || model.game.lastMove?.promotion)) {
      const p = this.position(model.game.lastMove.to);
      for (let i = 0; i < 12; i++) {
        const particle = this.add.rectangle(p.x, p.y, 5, 5, i % 2 ? 0xffd966 : 0xfff1c9).setDepth(15);
        const angle = i * Math.PI / 6;
        this.tweens.add({ targets: particle, x: p.x + Math.cos(angle) * 50, y: p.y + Math.sin(angle) * 50, alpha: 0, duration: 400, onComplete: () => particle.destroy() });
      }
    }
    this.renderedFen = model.game.fen;
    this.renderedFlip = model.flipped;
  }
}
