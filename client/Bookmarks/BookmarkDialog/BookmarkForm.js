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
import { ClearColorSwatch, BrandColorSwatch } from '../ColorSwatch';
import { isLink, fixLink, getRecentColors } from '../util';

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
		// What the user asked for, kept apart from what the checkbox shows: a url with no favicon
		// clears the box, and a url that has one hands the choice back.
		this.wantsFavicon = !!this.existingFaviconId;
		this._siteFaviconStatus = 'unknown';

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
			value: this.wantsFavicon,
			onChange: ({ value }) => {
				this.wantsFavicon = this.faviconCheckbox.options.value = value;

				if (value) this._queueFaviconPreview(this.options.data.url);
				else {
					this._setPendingFavicon(null);
					this._updateFaviconPreview(null);
					this._applyFaviconAvailability();
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
				this.wantsFavicon = true;
				this._setPendingFavicon(reader.result, { uploaded: true });
				this._updateFaviconPreview(reader.result);
				this._applyFaviconAvailability();
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

		this.faviconLabel = new Label({ label: 'Use site favicon', variant: 'inline' }, this.faviconCheckbox);

		this.faviconRow = new Elem({
			style: { display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0' },
			append: [this.faviconLabel, this.faviconPreview, this.faviconUploadButton, this.faviconUploadInput],
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
					swatches: ['random', ...getRecentColors()],
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
			this._queueFaviconPreview(url);
		});

		if (this.options.data.url) {
			this._queueBrandColorDetection(this.options.data.url);
			// Opening an edit only learns whether the site still has an icon; the saved one stays put
			// until the url changes or the box is toggled.
			this._queueFaviconPreview(this.options.data.url, { detectOnly: !!this.existingFaviconId });
		}
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

	/**
	 * Read by BookmarkDialog on save.
	 * @returns {boolean} The user's choice, unless the url left nothing to use.
	 */
	get useFavicon() {
		return this.wantsFavicon && !this._faviconUnavailable();
	}

	// Unavailable only when nothing could supply an image: the site answered without one, no icon
	// is saved, and nothing was uploaded. An unreachable site proves nothing, so it never disables.
	_faviconUnavailable() {
		return this._siteFaviconStatus === 'none' && !this.existingFaviconId && !this._pendingFaviconUploaded;
	}

	_applyFaviconAvailability() {
		const unavailable = this._faviconUnavailable();

		this.faviconCheckbox.options.disabled = unavailable;
		this.faviconCheckbox.options.value = this.wantsFavicon && !unavailable;
		this.faviconLabel.elem.title = unavailable ? 'No favicon found at this address' : '';
	}

	_setPendingFavicon(dataUri, { uploaded = false } = {}) {
		this._pendingFaviconDataUri = dataUri;
		this._pendingFaviconUploaded = !!dataUri && uploaded;
	}

	async _fetchFaviconPreview(url, { detectOnly = false } = {}) {
		this._faviconPreviewRequestUrl = url;

		const { body } = isLink(url) ? await getFaviconPreview(fixLink(url)) : {};

		if (!this.rendered || this._faviconPreviewRequestUrl !== url) return;

		this._siteFaviconStatus = isLink(url) ? body?.status || 'unreachable' : 'unknown';

		if (!detectOnly && this.wantsFavicon) {
			if (body?.dataUri) this._setPendingFavicon(body.dataUri);
			// The site's icon replaces an upload; the site's absence doesn't discard one.
			else if (!this._pendingFaviconUploaded) this._setPendingFavicon(null);

			const savedSrc = this.existingFaviconId && `/bookmarks/${this.existingFaviconId}/favicon`;

			this._updateFaviconPreview(this._pendingFaviconDataUri || savedSrc);
		}

		this._applyFaviconAvailability();
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
					this._queueFaviconPreview(clipboardContent);
				}
			})
			.catch(() => {});
	}
}
