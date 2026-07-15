import {
	Component,
	Form,
	ColorPicker,
	Input,
	Select,
	Button,
	Label,
	Elem,
	readClipboard,
	theme,
	styled,
	debounce,
} from '@vanilla-bean/components';

import { getCategories, getBrandColor, getFaviconPreview } from '../../api';
import { isLink, fixLink } from '../util';

// Matches ColorPicker's own swatch sizing/spacing so it sits consistently among the real color swatches.
const ClearColorSwatch = styled(
	Button,
	({ colors }) => `
		margin-top: 3px;
		margin-right: 3px;
		border: 1px solid ${colors.light(colors.gray)};
		background: repeating-linear-gradient(
			45deg,
			${colors.dark(colors.gray)},
			${colors.dark(colors.gray)} 4px,
			${colors.gray} 4px,
			${colors.gray} 8px
		);
	`,
);

// Dashed border marks it as "detected", distinct from a plain recent-color swatch.
const BrandColorSwatch = styled(
	Button,
	({ colors }) => `
		margin-top: 3px;
		margin-right: 3px;
		border: 2px dashed ${colors.white};
		display: none;

		&.detected {
			display: inline-block;
		}
	`,
);

const FaviconPreview = styled(
	Component,
	() => `
		width: 20px;
		height: 20px;
		vertical-align: middle;
		margin-right: 6px;
		display: none;

		&.visible {
			display: inline-block;
		}
	`,
);

export default class BookmarkForm extends Form {
	constructor(options = {}) {
		const storedColor = options.data?.color;
		// The bookmark's own id, if editing one that already has a stored favicon — lets the
		// preview show the saved image immediately instead of re-fetching it from the site.
		// Passed through as a plain option (rather than set on `this` here) because the base
		// Component constructor calls build() synchronously as part of super(), before any code
		// after this super() call would run — this.options is already populated by then, though.
		const existingFaviconId = options.data?.favicon ? options.data.id : null;

		super({
			...options,
			data: {
				name: '',
				url: '',
				category: options.category?.id || 'Default',
				...options.data,
				color: storedColor || options.category?.color || theme.colors.blue.toHslString(),
			},
			existingFaviconId,
		});

		// An explicit color is one the user picked, or one that already existed on the bookmark.
		// Until then the picker only previews the color the bookmark would inherit (category, then
		// a default), and that preview is not persisted — so it keeps following the category if it changes later.
		this.colorTouched = !!storedColor;
	}

	build() {
		this.existingFaviconId = this.options.existingFaviconId;
		this.useFavicon = !!this.existingFaviconId;

		this.clearColorSwatch = new ClearColorSwatch({
			title: 'Reset to automatic color (follows category)',
			'aria-label': 'Reset to automatic color',
			onPointerPress: () => {
				this.colorTouched = false;
				this._applyImplicitColor(this.options.data.category);
			},
		});

		this.brandColorSwatch = new BrandColorSwatch({
			title: "Use this site's detected brand color",
			'aria-label': 'Use detected brand color',
			onPointerPress: () => {
				if (!this._detectedBrandColor) return;

				this.colorTouched = true;
				this.options.data.color = this.inputElements.color.options.value = this.inputElements.color.parseValue(
					this._detectedBrandColor,
				).hslString;
			},
		});

		this.faviconPreview = new FaviconPreview({
			tag: 'img',
			...(this.existingFaviconId && {
				addClass: ['visible'],
				src: `/bookmarks/${this.existingFaviconId}/favicon`,
			}),
		});

		this.faviconCheckbox = new Input({
			type: 'checkbox',
			value: this.useFavicon,
			onChange: ({ value }) => {
				this.useFavicon = value;

				if (value) this._queueFaviconPreview(this.options.data.url);
				else {
					this._pendingFaviconDataUri = null;
					this._updateFaviconPreview(null);
				}
			},
		});

		this.faviconUploadInput = new Input({
			type: 'file',
			accept: 'image/*',
			style: { display: 'none' },
		});
		this.faviconUploadInput.elem.addEventListener('change', event => {
			const file = event.target.files[0];

			if (!file) return;

			const reader = new FileReader();

			reader.onload = () => {
				this.useFavicon = true;
				this.faviconCheckbox.options.value = true;
				this._pendingFaviconDataUri = reader.result;
				this._updateFaviconPreview(reader.result);
			};

			reader.readAsDataURL(file);
		});

		this.faviconUploadButton = new Button({
			textContent: 'Upload image…',
			onPointerPress: event => {
				event.preventDefault();
				this.faviconUploadInput.elem.click();
			},
		});

		this.faviconRow = new Elem({
			style: { display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0' },
			append: [
				new Label({ label: 'Use site favicon', variant: 'inline' }, this.faviconCheckbox),
				this.faviconPreview,
				this.faviconUploadButton,
				this.faviconUploadInput,
			],
		});

		this.newCategoryInput = new Input({
			type: 'text',
			style: { display: 'none' },
			validations: [
				[/.+/, 'Required'],
				[value => value !== 'New' && value !== 'Default', value => `Must not be reserved name: ${value}`],
			],
			onChange: ({ value }) => {
				this.newCategoryInput.options.value = value;

				this.options.data.category = this.newCategoryInput.parent.options.value = { create: { name: value } };

				this.newCategoryInput.validate();
			},
		});

		this.setOptions({
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{ key: 'url', validations: [[/.+/, 'Required']] },
				{
					key: 'category',
					InputComponent: Select,
					options: ['Default', { label: 'New', value: this.uniqueId }],
					append: [this.newCategoryInput],
				},
				{
					key: 'color',
					InputComponent: ColorPicker,
					parse: (value, input) => input.parseValue(value).hslString,
					swatches: ['random', ...(JSON.parse(localStorage.getItem('recentColors')) || [])],
					append: [this.clearColorSwatch, this.brandColorSwatch],
					onChange: () => {
						this.colorTouched = true;
					},
				},
			],
		});

		super.build();

		// The url field renders as a plain <input>, a void element that can't take children,
		// so the favicon row can't go through the field's own `append` — insert it after instead.
		this.inputElements.url.elem.parentElement.insertAdjacentElement('afterend', this.faviconRow.elem);

		this._populateAsyncFields();

		this.options.data.subscribe({
			key: 'category',
			callback: categoryId => {
				if (!this.colorTouched) this._applyImplicitColor(categoryId);
			},
		});

		// Fires on every keystroke (not the Form's usual onChange-on-blur binding) so detection
		// has the whole time the user spends filling out the rest of the form to finish, instead
		// of racing a fetch against however quickly they hit Save after leaving the url field.
		this._queueBrandColorDetection = debounce(url => this._detectBrandColor(url), 500);
		this._queueFaviconPreview = debounce(url => this._fetchFaviconPreview(url), 500);
		this.inputElements.url.elem.addEventListener('input', event => {
			const url = event.target.value;

			this._queueBrandColorDetection(url);
			if (this.useFavicon) this._queueFaviconPreview(url);
		});

		if (this.options.data.url) this._queueBrandColorDetection(this.options.data.url);
	}

	_applyImplicitColor(categoryId) {
		const implicitColor = this._categoriesById?.[categoryId]?.color || theme.colors.blue.toHslString();

		this.options.data.color = this.inputElements.color.options.value = implicitColor;
	}

	async _detectBrandColor(url) {
		this._brandColorRequestUrl = url;
		this._detectedBrandColor = null;
		this.brandColorSwatch.removeClass('detected');

		if (!isLink(url)) return;

		const { body } = await getBrandColor(fixLink(url));

		if (!this.rendered || this._brandColorRequestUrl !== url) return;

		if (body?.color) {
			this._detectedBrandColor = body.color;
			this.brandColorSwatch.setStyle({ backgroundColor: body.color });
			this.brandColorSwatch.addClass('detected');
		}
	}

	_updateFaviconPreview(src) {
		if (src) {
			this.faviconPreview.options.src = src;
			this.faviconPreview.addClass('visible');
		} else {
			this.faviconPreview.removeClass('visible');
		}
	}

	async _fetchFaviconPreview(url) {
		this._faviconPreviewRequestUrl = url;
		this._pendingFaviconDataUri = null;

		if (!isLink(url)) {
			this._updateFaviconPreview(null);

			return;
		}

		const { body } = await getFaviconPreview(fixLink(url));

		if (!this.rendered || this._faviconPreviewRequestUrl !== url || !this.useFavicon) return;

		this._pendingFaviconDataUri = body?.dataUri || null;
		this._updateFaviconPreview(this._pendingFaviconDataUri);
	}

	async _populateAsyncFields() {
		const { body: categories } = await getCategories();

		if (!this.rendered) return;

		this._categoriesById = categories;

		this.inputElements.category.options.options = [
			'Default',
			{ label: 'New', value: this.uniqueId },
			...Object.keys(categories).map(id => ({ label: categories[id]?.name, value: id })),
		];

		if (!this.colorTouched) this._applyImplicitColor(this.options.data.category);

		this.inputElements.name.elem.focus();

		// Clipboard access can reject (permission denied) or never settle (unanswered prompt);
		// isolate it so it can't block category population above.
		readClipboard()
			.then(clipboardContent => {
				if (this.rendered && !this.options.data.url && isLink(clipboardContent)) {
					this.options.data.url = clipboardContent;

					this._queueBrandColorDetection(clipboardContent);
					if (this.useFavicon) this._queueFaviconPreview(clipboardContent);
				}
			})
			.catch(() => {});
	}
}
