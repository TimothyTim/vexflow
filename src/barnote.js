// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
//
// A `BarNote` is used to render bar lines (from `barline.js`). `BarNote`s can
// be added to a voice and rendered in the middle of a stave. Since it has no
// duration, it consumes no `tick`s, and is dealt with appropriately by the formatter.
//
// See `tests/barnote_tests.js` for usage examples.

import { Vex } from './vex';
import { Note } from './note';
import { Barline } from './stavebarline';
import { BoundingBox } from './boundingbox';


// To enable logging for this class. Set `Vex.Flow.BarNote.DEBUG` to `true`.
function L(...args) { if (BarNote.DEBUG) Vex.L('Vex.Flow.BarNote', args); }

export class BarNote extends Note {
  constructor(type = Barline.type.SINGLE) {
    super({ duration: 'b' });
    this.setAttribute('type', 'BarNote');

    this.metrics = {
      widths: {},
    };

    const TYPE = Barline.type;
    this.metrics.widths = {
      [TYPE.SINGLE]: 8,
      [TYPE.DOUBLE]: 12,
      [TYPE.END]: 15,
      [TYPE.REPEAT_BEGIN]: 14,
      [TYPE.REPEAT_END]: 14,
      [TYPE.REPEAT_BOTH]: 18,
      [TYPE.NONE]: 0,
    };

    // Tell the formatter that bar notes have no duration.
    this.ignore_ticks = true;
    this.setType(type);
  }

  // Get and set the type of Bar note. `type` must be one of `Vex.Flow.Barline.type`.
  getType() { return this.type; }
  setType(type) {
    this.type = typeof(type) === 'string'
      ? Barline.typeString[type]
      : type;

    // Set width to width of relevant `Barline`.
    this.setWidth(this.metrics.widths[this.type]);
    return this;
  }

  getBoundingBox() {
    return new BoundingBox(0, 0, 0, 0);
  }

  addToModifierContext() {
    /* overridden to ignore */
    return this;
  }

  preFormat() {
    /* overridden to ignore */
    this.setPreFormatted(true);
    return this;
  }

  // Render note to stave.
  draw() {
    this.checkContext();
    if (!this.stave) throw new Vex.RERR('NoStave', "Can't draw without a stave.");
    L('Rendering bar line at: ', this.getAbsoluteX());
    const barline = new Barline(this.type);
    barline.setX(this.getAbsoluteX());
    barline.draw(this.stave);
    this.setRendered();
  }

/*
   * Barnote Extensions
   */
  clone() {
    const newBarNote = new Vex.Flow.BarNote();
    newBarNote.setType(this.getType());
    newBarNote.setStave(this.getStave());
    newBarNote.setTickContext(this.getTickContext());
    return newBarNote;
  }

  getPlayEvents(playInfo, currentEvents) {
    const newEvents = [];

    function markBeginRepeatIndex() {
      // mark current index as repeating point
      playInfo.beginRepeatIndex = currentEvents.length + newEvents.length;
    }

    function addRepeatEvents() {
      // Add all events since repeat index
      for (let i = playInfo.beginRepeatIndex || 0; i < currentEvents.length; i++) {
        newEvents.push(currentEvents[i]);
      }
    }

    switch (this.type) {
      case Vex.Flow.Barline.type.REPEAT_BEGIN:
        markBeginRepeatIndex();
        break;
      case Vex.Flow.Barline.type.REPEAT_END:
        addRepeatEvents();
        break;
      case Vex.Flow.Barline.type.REPEAT_BOTH:
        addRepeatEvents();
        markBeginRepeatIndex();
        break;
      default:
        break;
    }

    return newEvents;
  }
}
