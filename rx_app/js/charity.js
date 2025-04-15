// Charity functionality

// Fetch charity services
async function fetchCharityServices(charityId) {
  try {
    const snapshot = await servicesRef
      .where("charityId", "==", charityId)
      .orderBy("createdAt", "desc")
      .get();

    const services = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const serviceData = doc.data();

        // Get category name
        const categoryDoc = await categoriesRef
          .doc(serviceData.categoryId)
          .get();

        return {
          id: doc.id,
          ...serviceData,
          categoryName: categoryDoc.exists
            ? categoryDoc.data().name
            : "Unknown",
          createdAt: serviceData.createdAt
            ? formatDate(serviceData.createdAt)
            : "N/A",
          updatedAt: serviceData.updatedAt
            ? formatDate(serviceData.updatedAt)
            : "N/A",
        };
      })
    );

    return services;
  } catch (error) {
    console.error("Error fetching charity services:", error);
    showToast("Error fetching services", "error");
    return [];
  }
}

// Create service
async function createService(
  charityId,
  categoryId,
  title,
  description,
  address,
  phone,
  hours,
  eligibility,
  requirements
) {
  try {
    const serviceData = {
      charityId,
      categoryId,
      title,
      description,
      address,
      phone,
      hours,
      eligibility,
      requirements,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await servicesRef.add(serviceData);

    showToast("Service created successfully", "success");
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating service:", error);
    showToast("Error creating service", "error");
    return { success: false, error: error.message };
  }
}

// Update service
async function updateService(
  id,
  categoryId,
  title,
  description,
  address,
  phone,
  hours,
  eligibility,
  requirements
) {
  try {
    const serviceData = {
      categoryId,
      title,
      description,
      address,
      phone,
      hours,
      eligibility,
      requirements,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await servicesRef.doc(id).update(serviceData);

    showToast("Service updated successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error updating service:", error);
    showToast("Error updating service", "error");
    return { success: false, error: error.message };
  }
}

// Delete service
async function deleteService(id) {
  try {
    await servicesRef.doc(id).delete();

    showToast("Service deleted successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error deleting service:", error);
    showToast("Error deleting service", "error");
    return { success: false, error: error.message };
  }
}

// Toggle service status (active/inactive)
async function toggleServiceStatus(id, active) {
  try {
    await servicesRef.doc(id).update({
      active,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const status = active ? "activated" : "paused";
    showToast(`Service ${status} successfully`, "success");
    return { success: true };
  } catch (error) {
    console.error("Error toggling service status:", error);
    showToast("Error updating service status", "error");
    return { success: false, error: error.message };
  }
}

// Fetch charity dashboard stats
async function fetchCharityDashboardStats(charityId) {
  try {
    // Get counts for services
    const servicesSnapshot = await servicesRef
      .where("charityId", "==", charityId)
      .get();

    const activeServicesSnapshot = await servicesRef
      .where("charityId", "==", charityId)
      .where("active", "==", true)
      .get();

    // Get service counts by category
    const snapshot = await servicesRef
      .where("charityId", "==", charityId)
      .get();

    const servicesByCategoryCount = {};

    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const serviceData = doc.data();
        const categoryId = serviceData.categoryId;

        if (!servicesByCategoryCount[categoryId]) {
          // Get category name
          const categoryDoc = await categoriesRef.doc(categoryId).get();

          servicesByCategoryCount[categoryId] = {
            count: 0,
            name: categoryDoc.exists ? categoryDoc.data().name : "Unknown",
          };
        }

        servicesByCategoryCount[categoryId].count++;
      })
    );

    // Convert to array for easier handling in UI
    const servicesByCategory = Object.keys(servicesByCategoryCount).map(
      (key) => ({
        categoryId: key,
        categoryName: servicesByCategoryCount[key].name,
        count: servicesByCategoryCount[key].count,
      })
    );

    // Get recent services
    const recentServicesSnapshot = await servicesRef
      .where("charityId", "==", charityId)
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

        return {
          id: doc.id,
          ...serviceData,
          categoryName: categoryDoc.exists
            ? categoryDoc.data().name
            : "Unknown",
          createdAt: serviceData.createdAt
            ? formatDate(serviceData.createdAt)
            : "N/A",
        };
      })
    );

    return {
      totalServices: servicesSnapshot.size,
      activeServices: activeServicesSnapshot.size,
      servicesByCategory,
      recentServices,
    };
  } catch (error) {
    console.error("Error fetching charity dashboard stats:", error);
    showToast("Error fetching dashboard statistics", "error");
    return {
      totalServices: 0,
      activeServices: 0,
      servicesByCategory: [],
      recentServices: [],
    };
  }
}

// Update charity profile
async function updateCharityProfile(
  charityId,
  name,
  description,
  address,
  phone,
  website,
  email
) {
  try {
    await usersRef.doc(charityId).update({
      name,
      description,
      address,
      phone,
      website,
      email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Update session storage
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.name = name;
      sessionStorage.setItem("user", JSON.stringify(user));
    }

    showToast("Profile updated successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    showToast("Error updating profile", "error");
    return { success: false, error: error.message };
  }
}

// Fetch charity profile
async function fetchCharityProfile(charityId) {
  try {
    const doc = await usersRef.doc(charityId).get();

    if (!doc.exists) {
      showToast("Charity profile not found", "error");
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
        ? formatDate(doc.data().createdAt)
        : "N/A",
      approvedAt: doc.data().approvedAt
        ? formatDate(doc.data().approvedAt)
        : "N/A",
    };
  } catch (error) {
    console.error("Error fetching charity profile:", error);
    showToast("Error fetching profile", "error");
    return null;
  }
}
