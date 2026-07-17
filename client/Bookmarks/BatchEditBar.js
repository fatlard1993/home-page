import { Elem, Button, Icon, styled } from '@vanilla-bean/components';

export default class BatchEditBar extends styled.Component(
	({ colors }) => `
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin: 12px;
		padding: 10px 16px;
		border: 3px dashed ${colors.red};
		background: ${colors.alpha(colors.red, 0.14)};
		border-radius: 4px;
		box-shadow: 0 0 0 1px ${colors.alpha(colors.red, 0.5)};

		.icon {
			font-size: 1.4em;
			color: ${colors.light(colors.red)};
		}

		.label {
			flex: 1;
			min-width: 220px;
			font-weight: bold;
			font-size: 1.05em;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			color: ${colors.superWhite};
		}

		.markedCount {
			font-weight: bold;
			color: ${colors.light(colors.red)};
		}
	`,
) {
	build() {
		new Icon({ appendTo: this, addClass: ['icon'], icon: 'arrows-up-down-left-right' });

		new Elem({
			appendTo: this,
			addClass: ['label'],
			textContent: 'Batch Edit Mode: click to mark for deletion, drag to reorder or move',
		});

		this.countElem = new Elem({ appendTo: this, addClass: ['markedCount'] });
		this._renderMarkedCount(this.options.markedCount);

		new Button({
			appendTo: this,
			textContent: 'Done',
			icon: 'check',
			onPointerPress: () => this.options.done?.(),
			styles: ({ colors }) => ({
				background: colors.green,
				color: colors.mostReadable(colors.green, [colors.white, colors.black]),
			}),
		});

		new Button({
			appendTo: this,
			textContent: 'Cancel',
			icon: 'xmark',
			onPointerPress: () => this.options.cancel?.(),
			styles: ({ colors }) => ({
				background: colors.gray,
				color: colors.mostReadable(colors.gray, [colors.white, colors.black]),
			}),
		});
	}

	_renderMarkedCount(value) {
		this.countElem.elem.textContent = value > 0 ? `${value} marked for deletion` : '';
	}

	static schema = {
		markedCount: {
			set(value) {
				if (this.countElem) this._renderMarkedCount(value);
			},
		},
		done: {},
		cancel: {},
	};
}
