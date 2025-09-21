const handleUpload = async (e) => {
  e.preventDefault();
  
  if (!selectedFile) {
    alert('Please select a file');
    return;
  }

  if (!productData.name) {
    alert('Please enter a product name');
    return;
  }

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const queryParams = new URLSearchParams({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category
    });

    console.log('Uploading to:', `/api/upload-photo?${queryParams}`);
    
    const response = await fetch(`/api/upload-photo?${queryParams}`, {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (result.success) {
      alert('Photo uploaded successfully!');
      // Reset form...
    } else {
      throw new Error(result.details || result.error || 'Upload failed');
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error.message}`);
  } finally {
    setUploading(false);
  }
};
