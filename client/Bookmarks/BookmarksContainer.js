import { Link, Elem, styled } from 'vanilla-bean-components';
import { fixLink } from './util';

export default class BookmarksContainer extends (styled.Label`
	margin: 1px 0;
	padding: 3px 12px 6px 12px;

	label {
		font-weight: bold;
		pointer-events: none;
	}

	div {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-left: 6px;
	}
`) {
	_setOption(key, value) {
		if (key === 'bookmarks') {
			if (!this.linkContainer) this.linkContainer = new Elem({ appendTo: this });

			this.linkContainer.content(
				value.map(
					({ name, url, ...options }) =>
						new Link({
							textContent: name,
							href: fixLink(url),
							variant: 'button',
							styles: ({ colors }) => ({
								background: options.color || colors.blue,
								color: colors.mostReadable(options.color || colors.blue, [colors.white, colors.black]),
							}),
							...options,
						}),
				),
			);
		} else super._setOption(key, value);
	}
}
