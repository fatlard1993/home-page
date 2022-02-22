context('Listi - Items :: Update', () => {
	before(() => {
		cy.visit('#/list');

		//todo inject db doc
	});

	after(() => {
		//todo cleanup db doc
	});

	it('Adds a tag to an item', () => {
		cy.contains('.list .item', /test-item/i).click({ force: true });

		cy.get('.view.itemEdit').should('be.visible');

		cy.get('.addTag .textInput').type('test-tag');

		cy.get('.addTag .iconButton').click();

		cy.contains('.tag:not(.addTag)', /test-tag/i).should('be.visible');

		cy.get('.toolbar .iconButton.fa-save').click();

		cy.get('.view.list').should('be.visible');
	});
});