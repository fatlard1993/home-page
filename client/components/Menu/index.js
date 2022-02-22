import './index.css';

import Popover from '../Popover';

export default class Menu extends Popover {
	constructor({ className, ...rest }) {
		super({ className: ['menu', className], ...rest });
	}
}
