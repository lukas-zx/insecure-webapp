document.getElementById('link-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const url = document.getElementById('link-input').value

  const response = await fetch('/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  document.getElementById('link-preview').innerHTML = await response.text()
})