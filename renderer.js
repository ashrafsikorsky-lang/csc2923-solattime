document.addEventListener('DOMContentLoaded', () => {
    const prayerCategory = document.getElementById('prayerCategory');
    const itemInput = document.getElementById('itemInput');
    const addButton = document.getElementById('addButton');
    const itemList = document.getElementById('itemList');
    const crudFeedback = document.getElementById('crudFeedback');

    // load saved items from local storage (or dia start with empty array)
    let items = JSON.parse(localStorage.getItem('solatReminders')) || [];

    function saveItems() {
        localStorage.setItem('solatReminders', JSON.stringify(items));
    }

    function renderItems() {
        itemList.innerHTML = '';

        if (items.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.textContent = 'No reminders found. Add an activity above.';
            itemList.appendChild(emptyLi);
            return;
        }

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item + ' ';

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Update';
            updateButton.onclick = () => updateItem(index);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteItem(index);

            li.appendChild(updateButton);
            li.appendChild(deleteButton);
            itemList.appendChild(li);
        });
    }

    function addItem() {
        const newItem = itemInput.value.trim();
        if (newItem) {
            items.push(prayerCategory.value + ' ' + newItem);
            saveItems();
            itemInput.value = '';
            crudFeedback.style.color = 'green';
            crudFeedback.textContent = 'Reminder added and saved to Local Storage!';
            renderItems();
        } else {
            crudFeedback.style.color = 'red';
            crudFeedback.textContent = 'Invalid Input: Please enter an activity before clicking Add.';
        }
    }

    function updateItem(index) {
        const li = itemList.children[index];
        const currentText = items[index];

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.style.width = '300px';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.onclick = () => {
            const updatedItem = input.value.trim();
            if (updatedItem) {
                items[index] = updatedItem;
                saveItems();
                crudFeedback.style.color = 'green';
                crudFeedback.textContent = 'Reminder updated successfully!';
                renderItems();
            } else {
                crudFeedback.style.color = 'red';
                crudFeedback.textContent = 'Invalid Input: Updated text cannot be empty.';
            }
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = renderItems;

        li.innerHTML = '';
        li.appendChild(input);
        li.appendChild(saveButton);
        li.appendChild(cancelButton);
    }

    function deleteItem(index) {
        items.splice(index, 1);
        saveItems();
        crudFeedback.style.color = 'green';
        crudFeedback.textContent = 'Reminder deleted from Local Storage.';
        renderItems();
    }

    addButton.addEventListener('click', addItem);

    renderItems();
});