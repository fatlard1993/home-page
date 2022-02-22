import './index.css';

import { Button } from '../Button';

export class IconButton extends Button {
	constructor({ icon, className, ...rest }) {
		super({ className: ['iconButton', icon ? `fa-${icon}` : undefined, className], ...rest });
	}
}
