const auth_service_url = 'http://localhost:4000'

async function getUsers() {
  const response = await fetch(`${auth_service_url}/users`, {
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await response.json()
  return data.users
}

function renderUsers(users) {
  const userTableBody = document.querySelector('#user-table tbody')
  users.forEach(user => {
    const tr = document.createElement('tr')

    const tdUsername = document.createElement('td')
    tdUsername.innerHTML = user.username
    tr.appendChild(tdUsername)

    const tdEmail = document.createElement('td')
    tdEmail.innerHTML = user.email
    tr.appendChild(tdEmail)

    const tdAction = document.createElement('td')
    const deleteButton = document.createElement('button')
    deleteButton.onclick = async () => {
      const response = await fetch(`${auth_service_url}/delete/${user.id}`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) userTableBody.removeChild(tr)
    }
    deleteButton.textContent = 'delete'
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm')
    tdAction.appendChild(deleteButton)
    tr.appendChild(tdAction)

    userTableBody.appendChild(tr)
  })
}

getUsers().then(users => {
  renderUsers(users)
})
