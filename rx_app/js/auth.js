// Auth status observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
      // User is signed in
      const userDoc = await usersRef.doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Store user data in session
        sessionStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: userData.role,
          name: userData.name,
          approved: userData.approved || false
        }));
        
        // Redirect based on role and approval status
        if (userData.role === 'admin') {
          if (!window.location.pathname.includes('/admin/')) {
            window.location.href = '/admin/dashboard.html';
          }
        } else if (userData.role === 'charity') {
          if (userData.approved) {
            if (!window.location.pathname.includes('/charity/')) {
              window.location.href = '/charity/dashboard.html';
            }
          } else {
            // Show pending approval message
            if (window.location.pathname !== '/pending-approval.html') {
              window.location.href = '/pending-approval.html';
            }
          }
        }
      } else {
        console.error('User document does not exist');
        await auth.signOut();
        window.location.href = '/login.html';
      }
    } else {
      // User is signed out
      sessionStorage.removeItem('user');
      
      // Redirect to login if trying to access protected pages
      const protectedPaths = ['/admin/', '/charity/'];
      if (protectedPaths.some(path => window.location.pathname.includes(path))) {
        window.location.href = '/login.html';
      }
    }
  });
  
  // Login function
  const login = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Signup function for charities
  const signupCharity = async (email, password, name, description, address, phone) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Add user data to Firestore
      await usersRef.doc(user.uid).set({
        email,
        name,
        description,
        address,
        phone,
        role: 'charity',
        approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/index.html';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Create admin account (for initial setup)
  const createAdmin = async (email, password, name) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Add admin data to Firestore
      await usersRef.doc(user.uid).set({
        email,
        name,
        role: 'admin',
        approved: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Password reset
  const resetPassword = async (email) => {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };