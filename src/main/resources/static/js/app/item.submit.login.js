// Publish Item Modal Logic

export const submit_login = function () {
    document.getElementById('publishForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('itemTitle').value;
        const category = document.getElementById('itemCategory').value;
        const description = document.getElementById('itemDescription').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const condition = parseInt(document.getElementById('itemCondition').value);
        const location = document.getElementById('itemLocation').value;
        const isUrgent = document.getElementById('isUrgent').checked;
        const isShippingFree = document.getElementById('isShippingFree').checked;
        const canInspect = document.getElementById('canInspect').checked;
        // For images, you would typically upload them separately or use FormData
        // For now, we'll send an empty array or placeholder if the API expects it.

        if (!title || !category || !description || isNaN(price) || isNaN(condition)) {
            window.notify.show('请填写所有必填项！', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/market/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken()
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    description: description,
                    price: price,
                    condition: condition, // Assuming backend handles this
                    location: location,
                    isUrgent: isUrgent, // Assuming backend handles this
                    isShippingFree: isShippingFree, // Assuming backend handles this
                    canInspect: canInspect, // Assuming backend handles this
                    images: [] // Placeholder for images
                })
            });

            if (response.ok) {
                window.notify.show('商品上架成功！', 'success');
                closePublish();
                // Optionally clear form or refresh item list
                document.getElementById('publishForm').reset();
            } else {
                const errorData = await response.json();
                window.notify.show(`上架失败: ${errorData.message || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting item:', error);
            window.notify.show('网络错误，上架失败。', 'error');
        }
    });
}