const API_URL = '/api'
const itemsGrid = document.getElementById('items-grid')
const loading = document.getElementById('loading')
const addItemBtn = document.getElementById('add-item-btn')
const modal = document.getElementById('item-modal')
const closeModalBtn = document.getElementById('close-modal-btn')
const itemForm = document.getElementById('item-form')

let items = []

function currentUserId() { return localStorage.getItem('userId') }

document.addEventListener('DOMContentLoaded', fetchItems)

if (addItemBtn) {
    addItemBtn.addEventListener('click', () => toggleModal(true))
} else console.warn('add-item-btn not found')

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => toggleModal(false))
} else console.warn('close-modal-btn not found')

if (itemForm) {
    itemForm.addEventListener('submit', handleAddItem)
} else console.warn('item-form not found')

// Oracle feature removed

function toggleModal(show) {
    if (!modal) return console.warn('toggleModal: modal element not found')
    if (show) {
        modal.classList.add('modal-active')
    } else {
        modal.classList.remove('modal-active')
        if (itemForm) itemForm.reset()
    }
}

async function fetchItems() {
    try {
        const res = await fetch(`${API_URL}/items`)
        if (!res.ok) throw new Error('Failed to fetch offerings')
        items = await res.json()
        renderItems()
    } catch (err) {
        console.error(err)
        loading.innerHTML = '<span class="text-red-500">The connection to Olympus was severed.</span>'
    }
}

function renderItems() {
    loading.style.display = 'none'
    itemsGrid.innerHTML = ''
    if (items.length === 0) {
        itemsGrid.innerHTML = '<div class="col-span-full text-center font-mono text-lunar/50 py-12">No offerings in the temple yet.</div>'
        return
    }
    items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'lunar-card p-6 flex flex-col h-full rounded-lg'
        const ownerId = item.owner ? String(item.owner) : null
        const isOwner = ownerId && ownerId === currentUserId()
        const contactHtml = `
          <div class="mt-3 space-y-1">
            ${item.offererPhone ? `<a class="block text-sm text-bronze font-mono" href="tel:${item.offererPhone}">${item.offererPhone}</a>` : ''}
            ${item.offererTelegram ? `<a class="block text-sm text-bronze font-mono" href="https://t.me/${item.offererTelegram}" target="_blank">@${item.offererTelegram}</a>` : ''}
          </div>
        `
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-serif text-bronze font-bold">${item.name}</h3>
                <span class="px-2 py-1 bg-bronze/10 border border-bronze/30 text-bronze text-xs font-mono rounded">${item.condition}</span>
            </div>
            <p class="text-lunar/80 font-sans text-sm flex-grow mb-4 leading-relaxed">${item.description}</p>
            ${contactHtml}
            <div class="flex justify-between items-end border-t border-bronze/20 pt-4 mt-auto">
                <span class="text-xs font-mono text-lunar/50">${item.category}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xl font-mono text-bronze">${item.price} ETB</span>
                  ${isOwner ? `<button data-id="${item._id}" class="edit-btn px-2 py-1 border border-bronze text-bronze text-xs">Edit</button><button data-id="${item._id}" class="delete-btn px-2 py-1 border border-red-500 text-red-400 text-xs">Delete</button>` : ''}
                </div>
            </div>
        `
        itemsGrid.appendChild(card)
        if (isOwner) {
          const editBtn = card.querySelector('.edit-btn')
          const delBtn = card.querySelector('.delete-btn')
          if (editBtn) editBtn.addEventListener('click', () => editItem(editBtn.dataset.id))
          if (delBtn) delBtn.addEventListener('click', () => deleteItem(delBtn.dataset.id))
        }
    })
}

async function handleAddItem(e) {
    e.preventDefault()
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.innerText
    submitBtn.innerText = 'Offering...'
    submitBtn.disabled = true
        const newItem = {
        name: document.getElementById('item-name').value,
        price: Number(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value,
        condition: document.getElementById('item-condition').value,
        description: document.getElementById('item-description').value,
        offererPhone: document.getElementById('offerer-phone').value || undefined,
        offererTelegram: document.getElementById('offerer-tg').value || undefined
    }
    try {
        const token = localStorage.getItem('token')
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
                const editingId = itemForm.dataset.editingId
                let res
                if (editingId) {
                    res = await fetch(`${API_URL}/items/${editingId}`, { method: 'PUT', headers, body: JSON.stringify(newItem) })
                } else {
                    res = await fetch(`${API_URL}/items`, { method: 'POST', headers, body: JSON.stringify(newItem) })
                }
        if (!res.ok) throw new Error('Failed to offer item')
        await fetchItems()
                toggleModal(false)
                delete itemForm.dataset.editingId
    } catch (err) {
        console.error(err)
        alert('Failed to complete ritual.')
    } finally {
        submitBtn.innerText = originalText
        submitBtn.disabled = false
    }
}

async function deleteItem(id) {
    if (!confirm('Delete this offering?')) return
    try {
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE', headers })
        if (!res.ok) throw new Error('Delete failed')
        await fetchItems()
    } catch (err) {
        alert(err.message)
    }
}

async function editItem(id) {
    try {
        const res = await fetch(`${API_URL}/items/${id}`)
        if (!res.ok) throw new Error('Failed to load item')
        const item = await res.json()
        document.getElementById('item-name').value = item.name
        document.getElementById('item-price').value = item.price
        document.getElementById('item-category').value = item.category
        document.getElementById('item-condition').value = item.condition
        document.getElementById('item-description').value = item.description
        document.getElementById('offerer-phone').value = item.offererPhone || ''
        document.getElementById('offerer-tg').value = item.offererTelegram || ''
        itemForm.dataset.editingId = id
        toggleModal(true)
    } catch (err) {
        alert(err.message)
    }
}

// consultOracle removed
