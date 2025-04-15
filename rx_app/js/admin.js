// Admin functionality

// Fetch service categories
async function fetchCategories() {
  try {
    const snapshot = await categoriesRef.orderBy("name").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    showToast("Error fetching categories", "error");
    return [];
  }
}

// Create service category
async function createCategory(name, description, icon) {
  try {
    const categoryData = {
      name,
      description,
      icon,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await categoriesRef.add(categoryData);

    showToast("Category created successfully", "success");
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating category:", error);
    showToast("Error creating category", "error");
    return { success: false, error: error.message };
  }
}

// Update service category
async function updateCategory(id, name, description, icon) {
  try {
    const categoryData = {
      name,
      description,
      icon,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await categoriesRef.doc(id).update(categoryData);

    showToast("Category updated successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    showToast("Error updating category", "error");
    return { success: false, error: error.message };
  }
}

// Delete service category
async function deleteCategory(id) {
  try {
    // Check if there are services using this category
    const servicesSnapshot = await servicesRef
      .where("categoryId", "==", id)
      .limit(1)
      .get();

    if (!servicesSnapshot.empty) {
      showToast("Cannot delete category that is in use by services", "error");
      return { success: false, error: "Category in use" };
    }

    await categoriesRef.doc(id).delete();

    showToast("Category deleted successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    showToast("Error deleting category", "error");
    return { success: false, error: error.message };
  }
}

// Fetch pending charity accounts
async function fetchPendingCharities() {
  try {
    const snapshot = await usersRef
      .where("role", "==", "charity")
      .where("approved", "==", false)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? formatDate(doc.data().createdAt)
        : "N/A",
    }));
  } catch (error) {
    console.error("Error fetching pending charities:", error);
    showToast("Error fetching pending charities", "error");
    return [];
  }
}

// Fetch all charity accounts
async function fetchAllCharities() {
  try {
    const snapshot = await usersRef
      .where("role", "==", "charity")
      .orderBy("name")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? formatDate(doc.data().createdAt)
        : "N/A",
    }));
  } catch (error) {
    console.error("Error fetching charities:", error);
    showToast("Error fetching charities", "error");
    return [];
  }
}

// Approve charity account
async function approveCharity(id) {
  try {
    await usersRef.doc(id).update({
      approved: true,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showToast("Charity approved successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error approving charity:", error);
    showToast("Error approving charity", "error");
    return { success: false, error: error.message };
  }
}

// Reject/delete charity account
async function rejectCharity(id) {
  try {
    // Get the user's email
    const userDoc = await usersRef.doc(id).get();
    const userEmail = userDoc.data().email;

    // Delete the user document
    await usersRef.doc(id).delete();

    // TODO: Ideally we would delete the Auth user as well, but that requires admin SDK
    // For a complete solution, you would use Cloud Functions to delete the auth user

    showToast("Charity rejected successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting charity:", error);
    showToast("Error rejecting charity", "error");
    return { success: false, error: error.message };
  }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
  try {
    // Get counts for various collections
    const categoriesSnapshot = await categoriesRef.get();
    const servicesSnapshot = await servicesRef.get();
    const charitiesSnapshot = await usersRef
      .where("role", "==", "charity")
      .get();
    const pendingCharitiesSnapshot = await usersRef
      .where("role", "==", "charity")
      .where("approved", "==", false)
      .get();

    // Get recent services
    const recentServicesSnapshot = await servicesRef
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const recentServices = await Promise.all(
      recentServicesSnapshot.docs.map(async (doc) => {
        const serviceData = doc.data();
        // Get category name
        const categoryDoc = await categoriesRef
          .doc(serviceData.categoryId)
          .get();
        // Get charity name
        const charityDoc = await usersRef.doc(serviceData.charityId).get();

        return {
          id: doc.id,
          ...serviceData,
          categoryName: categoryDoc.exists
            ? categoryDoc.data().name
            : "Unknown",
          charityName: charityDoc.exists ? charityDoc.data().name : "Unknown",
          createdAt: serviceData.createdAt
            ? formatDate(serviceData.createdAt)
            : "N/A",
        };
      })
    );

    return {
      categoriesCount: categoriesSnapshot.size,
      servicesCount: servicesSnapshot.size,
      charitiesCount: charitiesSnapshot.size,
      pendingCharitiesCount: pendingCharitiesSnapshot.size,
      recentServices,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    showToast("Error fetching dashboard statistics", "error");
    return {
      categoriesCount: 0,
      servicesCount: 0,
      charitiesCount: 0,
      pendingCharitiesCount: 0,
      recentServices: [],
    };
  }
}
