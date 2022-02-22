import './index.css';

import DomElem from '../../DomElem';

import { toHSV, hsvToRGB, randomRGB } from './util';
import { saturation, hue } from './svg';
import dom from 'dom';
import { TextInput } from '..';
import Label from '../../Label';

export class ColorPicker {
	constructor({ className, value: initialValue = '#666', onChange = () => {}, label = 'Color', appendTo, ...rest } = {}) {
		this.isDirty = () => initialValue !== this.value;

		this.onChange = onChange;

		this.label = new Label({ label, className: 'colorPickerLabel' });

		this.elem = new DomElem('div', { className: ['colorPicker', className], appendTo: appendTo || this.label, ...rest });

		this.pickerArea = new DomElem('div', { className: 'pickerArea', innerHTML: saturation, appendTo: this.elem });
		this.pickerIndicator = new DomElem('div', { className: 'indicator', appendTo: this.pickerArea });

		this.hueArea = new DomElem('div', { className: 'hueArea', innerHTML: hue, appendTo: this.elem });
		this.hueIndicator = new DomElem('div', { className: 'indicator', appendTo: this.hueArea });

		this.textInput = new TextInput({
			appendTo: this.label,
			onChange: ({ value }) => {
				this.set(value);
			},
		});

		this.set(initialValue);

		document.addEventListener('mousedown', this.onPointerDown.bind(this));
		document.addEventListener('touchstart', this.onPointerDown.bind(this));
	}

	set(color) {
		if (!color) return;

		const hsv = toHSV(color === 'random' ? randomRGB() : color);

		this.elem.style.backgroundColor = this.value = hsvToRGB(hsv);

		this.pickerArea.style.backgroundColor = `hsl(${hsv.h}, 100%, 50%)`;

		this.textInput.value = this.value;

		this.onChange(this.value);
	}

	normalizePosition(evt, parent, offsetX, offsetY) {
		const position = {
			x: evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX,
			y: evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY,
		};
		const boundingRect = parent.getBoundingClientRect();

		// Account for parent element position
		position.x -= boundingRect.left;
		position.y -= boundingRect.top;

		// Account for indicator size
		position.x += offsetX;
		position.y += offsetY;

		// Account for parent element bounds
		position.x = Math.min(Math.max(offsetX, position.x), parent.clientWidth + offsetX);
		position.y = Math.min(Math.max(offsetY, position.y), parent.clientHeight + offsetY);

		return position;
	}

	pickerMove(evt) {
		evt.preventDefault();

		if (this.runningAnim) return;
		this.runningAnim = true;

		const indicatorOffsetX = this.pickerIndicator.clientWidth / 2;
		const indicatorOffsetY = this.pickerIndicator.clientHeight / 2;
		const position = this.normalizePosition(evt, this.pickerArea, indicatorOffsetX, indicatorOffsetY);
		const pickerAreaWidth = this.pickerArea.clientWidth;
		const pickerAreaHeight = this.pickerArea.clientHeight;

		position.x -= indicatorOffsetX;
		position.y -= indicatorOffsetY;

		const { h } = toHSV(this.value);

		const newS = position.x / pickerAreaWidth;
		const newV = (pickerAreaHeight - position.y) / pickerAreaHeight;
		const newValue = hsvToRGB({ h, s: newS, v: newV });

		this.addAnimation(() => {
			this.setTransform(this.pickerIndicator, `translate3d(${position.x}px, ${position.y}px, 0)`);

			this.set(newValue);

			this.runningAnim = false;
		});
	}

	hueMove(evt) {
		evt.preventDefault();

		if (this.runningAnim) return;
		this.runningAnim = true;

		const indicatorOffset = this.hueIndicator.clientWidth / 2;
		const position = this.normalizePosition(evt, this.hueArea, indicatorOffset, indicatorOffset);
		const hueAreaWidth = this.hueArea.clientWidth;

		position.x -= indicatorOffset;

		const { s, v } = toHSV(this.value);

		const newHue = (position.x / hueAreaWidth) * 360;
		const newValue = hsvToRGB({ h: newHue, s, v });

		this.addAnimation(() => {
			this.setTransform(this.hueIndicator, `translate3d(${position.x - indicatorOffset / 2}px, 0, 0)`);

			this.set(newValue);

			this.pickerArea.style.backgroundColor = `hsl(${newHue}, 100%, 50%)`;

			this.runningAnim = false;
		});
	}

	onPointerDown(evt) {
		if (dom.isMobile && !evt.targetTouches) return;

		if (['pickerArea', 'hueArea'].includes(evt.target.className)) {
			const moveFunc = this[`${evt.target.className.replace('Area', '')}Move`].bind(this);

			const dropFunc = () => {
				document.removeEventListener('mouseup', dropFunc);
				document.removeEventListener('mousemove', moveFunc);
				document.removeEventListener('touchend', dropFunc);
				document.removeEventListener('touchcancel', dropFunc);
				document.removeEventListener('touchmove', moveFunc);
			};

			document.addEventListener('mouseup', dropFunc);
			document.addEventListener('mousemove', moveFunc);
			document.addEventListener('touchend', dropFunc);
			document.addEventListener('touchcancel', dropFunc);
			document.addEventListener('touchmove', moveFunc);

			moveFunc(evt);
		}
	}

	addAnimation(func) {
		const raf =
			window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (cb) {
				return setTimeout(cb, 16);
			};

		raf(func);
	}

	setTransform(elem, value) {
		elem.style.transform = elem.style.webkitTransform = elem.style.MozTransform = elem.style.msTransform = elem.style.OTransform = value;
	}
}
