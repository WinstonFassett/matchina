import React from "react";
import { matchbox, facade } from "matchina";

// Simple form machine for login
export function FormMachineDemo() {
  // Define our form states
  type FormValues = {
    email: string;
    password: string;
  };

  type FormErrors = {
    email: string | null;
    password: string | null;
  };

  // Initial values
  const initialValues: FormValues = {
    email: "",
    password: ""
  };

  // Validation function
  const validate = (values: FormValues): FormErrors => {
    const errors: FormErrors = {
      email: null,
      password: null
    };
    
    if (!values.email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = "Invalid email address";
    }
    
    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    return errors;
  };

  // Helper function to check if there are any errors
  const hasErrors = (errors: FormErrors): boolean => {
    return Object.values(errors).some(error => error !== null);
  };

  // Helper function to get only the non-null errors
  const getErrorsOnly = (errors: FormErrors): Partial<FormErrors> => {
    return Object.entries(errors).reduce((acc, [key, value]) => {
      if (value !== null) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {} as Partial<FormErrors>);
  };

  // Define our form machine
  const formMachine = React.useMemo(() => {
    // Form states with proper types
    const states = {
      Pristine: {
        values: initialValues,
        touched: { email: false, password: false },
        errors: {} as Partial<FormErrors>
      },
      
      Editing: (
        values: FormValues,
        touched: Record<keyof FormValues, boolean>,
        errors: Partial<FormErrors>
      ) => ({
        values,
        touched,
        errors
      }),
      
      Invalid: (
        values: FormValues,
        touched: Record<keyof FormValues, boolean>,
        errors: Partial<FormErrors>
      ) => ({
        values,
        touched,
        errors
      }),
      
      Submitting: (values: FormValues) => ({
        values
      }),
      
      Success: (values: FormValues, response: any) => ({
        values,
        response
      }),
      
      Error: (values: FormValues, error: string) => ({
        values,
        error
      })
    };
    
    // Create the machine
    return facade(
      states,
      {
        Pristine: {
          // Update a field value
          updateField: <K extends keyof FormValues>(field: K, value: FormValues[K], state) => {
            const newValues = {
              ...state.data.values,
              [field]: value
            };
            
            const newTouched = {
              ...state.data.touched,
              [field]: true
            };
            
            const errors = validate(newValues);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: newValues,
                  touched: newTouched,
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Editing",
              data: {
                values: newValues,
                touched: newTouched,
                errors: {}
              }
            };
          },
          
          // Try to submit the pristine form
          submit: (state) => {
            const errors = validate(state.data.values);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: state.data.values,
                  touched: { email: true, password: true },
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Submitting",
              data: {
                values: state.data.values
              }
            };
          }
        },

        Editing: {
          // Update a field in editing state
          updateField: <K extends keyof FormValues>(field: K, value: FormValues[K], state) => {
            const newValues = {
              ...state.data.values,
              [field]: value
            };
            
            const newTouched = {
              ...state.data.touched,
              [field]: true
            };
            
            const errors = validate(newValues);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: newValues,
                  touched: newTouched,
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Editing",
              data: {
                values: newValues,
                touched: newTouched,
                errors: {}
              }
            };
          },
          
          // Submit the form when in editing state
          submit: (state) => {
            const errors = validate(state.data.values);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: state.data.values,
                  touched: { email: true, password: true },
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Submitting",
              data: {
                values: state.data.values
              }
            };
          },
          
          // Reset the form
          reset: () => ({
            key: "Pristine",
            data: {
              values: initialValues,
              touched: { email: false, password: false },
              errors: {}
            }
          })
        },
        
        Invalid: {
          // Update a field in invalid state
          updateField: <K extends keyof FormValues>(field: K, value: FormValues[K], state) => {
            const newValues = {
              ...state.data.values,
              [field]: value
            };
            
            const newTouched = {
              ...state.data.touched,
              [field]: true
            };
            
            const errors = validate(newValues);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: newValues,
                  touched: newTouched,
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Editing",
              data: {
                values: newValues,
                touched: newTouched,
                errors: {}
              }
            };
          },
          
          // Submit the form when in invalid state
          submit: (state) => {
            const errors = validate(state.data.values);
            const errorsExist = hasErrors(errors);
            
            if (errorsExist) {
              return {
                key: "Invalid",
                data: {
                  values: state.data.values,
                  touched: { email: true, password: true },
                  errors: getErrorsOnly(errors)
                }
              };
            }
            
            return {
              key: "Submitting",
              data: {
                values: state.data.values
              }
            };
          },
          
          // Reset the form
          reset: () => ({
            key: "Pristine",
            data: {
              values: initialValues,
              touched: { email: false, password: false },
              errors: {}
            }
          })
        },
        
        Submitting: {
          // Submission succeeded
          success: (response, state) => ({
            key: "Success",
            data: {
              values: state.data.values,
              response
            }
          }),
          
          // Submission failed
          error: (errorMessage: string, state) => ({
            key: "Error",
            data: {
              values: state.data.values,
              error: errorMessage
            }
          })
        },
        
        Success: {
          // Reset form after success
          reset: () => ({
            key: "Pristine",
            data: {
              values: initialValues,
              touched: { email: false, password: false },
              errors: {}
            }
          })
        },
        
        Error: {
          // Try submitting again
          submit: (state) => ({
            key: "Submitting",
            data: {
              values: state.data.values
            }
          }),
          
          // Reset form after error
          reset: () => ({
            key: "Pristine",
            data: {
              values: initialValues,
              touched: { email: false, password: false },
              errors: {}
            }
          })
        }
      },
      "Pristine" // Initial state
    );
  }, []);

  // State for tracking async operations
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    formMachine.submit();
    
    if (formMachine.state.is("Submitting")) {
      setIsSubmitting(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        formMachine.success({ user: { id: 1, name: "User" } });
      } catch (error) {
        formMachine.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Styles for the form
  const styles = {
    form: {
      maxWidth: "400px",
      margin: "0 auto",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif"
    },
    formGroup: {
      marginBottom: "16px"
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontWeight: "bold"
    },
    input: {
      width: "100%",
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "16px"
    },
    inputInvalid: {
      border: "1px solid #ff3860"
    },
    errorMessage: {
      color: "#ff3860",
      fontSize: "14px",
      marginTop: "4px"
    },
    button: {
      backgroundColor: "#485fc7",
      color: "white",
      border: "none",
      padding: "10px 15px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
      marginRight: "10px"
    },
    resetButton: {
      backgroundColor: "#f14668",
      color: "white",
      border: "none",
      padding: "10px 15px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px"
    },
    successMessage: {
      backgroundColor: "#23d160",
      color: "white",
      padding: "10px",
      borderRadius: "4px",
      marginBottom: "16px"
    },
    errorBanner: {
      backgroundColor: "#ff3860",
      color: "white",
      padding: "10px",
      borderRadius: "4px",
      marginBottom: "16px"
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Login Form</h2>
        
        {/* Display success message */}
        {formMachine.state.is("Success") && (
          <div style={styles.successMessage}>
            Login successful! Welcome back, {formMachine.state.data.response.user.name}!
          </div>
        )}
        
        {/* Display error message */}
        {formMachine.state.is("Error") && (
          <div style={styles.errorBanner}>
            {formMachine.state.data.error}
          </div>
        )}
        
        {/* Email field */}
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={formMachine.state.match({
              Pristine: (data) => data.values.email,
              Editing: (data) => data.values.email,
              Invalid: (data) => data.values.email,
              Submitting: (data) => data.values.email,
              Success: (data) => data.values.email,
              Error: (data) => data.values.email
            })}
            onChange={(e) => formMachine.updateField("email", e.target.value)}
            style={{
              ...styles.input,
              ...(formMachine.state.is("Invalid") && 
                 formMachine.state.data.touched.email && 
                 formMachine.state.data.errors.email ? styles.inputInvalid : {})
            }}
          />
          {formMachine.state.is("Invalid") && 
           formMachine.state.data.touched.email && 
           formMachine.state.data.errors.email && (
            <div style={styles.errorMessage}>
              {formMachine.state.data.errors.email}
            </div>
          )}
        </div>
        
        {/* Password field */}
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            value={formMachine.state.match({
              Pristine: (data) => data.values.password,
              Editing: (data) => data.values.password,
              Invalid: (data) => data.values.password,
              Submitting: (data) => data.values.password,
              Success: (data) => data.values.password,
              Error: (data) => data.values.password
            })}
            onChange={(e) => formMachine.updateField("password", e.target.value)}
            style={{
              ...styles.input,
              ...(formMachine.state.is("Invalid") && 
                 formMachine.state.data.touched.password && 
                 formMachine.state.data.errors.password ? styles.inputInvalid : {})
            }}
          />
          {formMachine.state.is("Invalid") && 
           formMachine.state.data.touched.password && 
           formMachine.state.data.errors.password && (
            <div style={styles.errorMessage}>
              {formMachine.state.data.errors.password}
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <button 
          type="submit" 
          style={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        
        {/* Reset button */}
        <button 
          type="button"
          onClick={() => formMachine.reset()}
          disabled={isSubmitting}
          style={styles.resetButton}
        >
          Reset
        </button>
        
        {/* Form state display for debugging */}
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <strong>Current State:</strong> {formMachine.state.key}
        </div>
      </form>
    </div>
  );
}
    
    Editing: (
      values: TFields,
      touched: Record<keyof TFields, boolean>,
      errors: Partial<TErrors>
    ) => ({
      values,
      touched,
      errors
    }),
    
    Invalid: (
      values: TFields,
      touched: Record<keyof TFields, boolean>,
      errors: TErrors
    ) => ({
      values,
      touched,
      errors
    }),
    
    Submitting: (
      values: TFields
    ) => ({
      values
    }),
    
    Success: (
      values: TFields,
      response?: any
    ) => ({
      values,
      response
    }),
    
    Error: (
      values: TFields,
      error: string
    ) => ({
      values,
      error
    })
  });
  
  // Helper functions for validation state
  function hasErrors(errors: Partial<TErrors>): boolean {
    return Object.values(errors).some(error => error !== null && error !== undefined);
  }
  
  function getErrorsOnly(errors: TErrors): Partial<TErrors> {
    return Object.entries(errors).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<TErrors>);
  }
  
  function touchAll(fields: TFields): Record<keyof TFields, boolean> {
    return Object.keys(fields).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<keyof TFields, boolean>);
  }
  
  // Create the form machine
  return facade(
    states,
    {
      Pristine: {
        // Update a field value
        updateField: <K extends keyof TFields>(
          field: K,
          value: TFields[K],
          state
        ) => {
          const newValues = {
            ...state.data.values,
            [field]: value
          };
          
          const newTouched = {
            ...state.data.touched,
            [field]: true
          };
          
          const errors = validate(newValues);
          const errorsExist = hasErrors(errors);
          
          return {
            key: errorsExist ? "Invalid" : "Editing",
            data: {
              values: newValues,
              touched: newTouched,
              errors: getErrorsOnly(errors)
            }
          };
        },
        
        // Try to submit the pristine form
        submit: (state) => {
          const errors = validate(state.data.values);
          const errorsExist = hasErrors(errors);
          
          if (errorsExist) {
            return {
              key: "Invalid",
              data: {
                values: state.data.values,
                touched: touchAll(state.data.values),
                errors: getErrorsOnly(errors)
              }
            };
          }
          
          return {
            key: "Submitting",
            data: {
              values: state.data.values
            }
          };
        }
      },

      Editing: {
        // Update a field in editing state
        updateField: <K extends keyof TFields>(
          field: K,
          value: TFields[K],
          state
        ) => {
          const newValues = {
            ...state.data.values,
            [field]: value
          };
          
          const newTouched = {
            ...state.data.touched,
            [field]: true
          };
          
          const errors = validate(newValues);
          const errorsExist = hasErrors(errors);
          
          return {
            key: errorsExist ? "Invalid" : "Editing",
            data: {
              values: newValues,
              touched: newTouched,
              errors: getErrorsOnly(errors)
            }
          };
        },
        
        // Submit the form when in editing state
        submit: (state) => {
          const errors = validate(state.data.values);
          const errorsExist = hasErrors(errors);
          
          if (errorsExist) {
            return {
              key: "Invalid",
              data: {
                values: state.data.values,
                touched: touchAll(state.data.values),
                errors: getErrorsOnly(errors)
              }
            };
          }
          
          return {
            key: "Submitting",
            data: {
              values: state.data.values
            }
          };
        },
        
        // Reset the form
        reset: () => ({
          key: "Pristine",
          data: {
            values: initialValues,
            touched: Object.keys(initialValues).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as Record<keyof TFields, boolean>),
            errors: {}
          }
        })
      },
      
      Invalid: {
        // Update a field in invalid state
        updateField: <K extends keyof TFields>(
          field: K,
          value: TFields[K],
          state
        ) => {
          const newValues = {
            ...state.data.values,
            [field]: value
          };
          
          const newTouched = {
            ...state.data.touched,
            [field]: true
          };
          
          const errors = validate(newValues);
          const errorsExist = hasErrors(errors);
          
          return {
            key: errorsExist ? "Invalid" : "Editing",
            data: {
              values: newValues,
              touched: newTouched,
              errors: getErrorsOnly(errors)
            }
          };
        },
        
        // Submit the form when in invalid state
        submit: (state) => {
          const errors = validate(state.data.values);
          const errorsExist = hasErrors(errors);
          
          if (errorsExist) {
            return {
              key: "Invalid",
              data: {
                values: state.data.values,
                touched: touchAll(state.data.values),
                errors: getErrorsOnly(errors)
              }
            };
          }
          
          return {
            key: "Submitting",
            data: {
              values: state.data.values
            }
          };
        },
        
        // Reset the form
        reset: () => ({
          key: "Pristine",
          data: {
            values: initialValues,
            touched: Object.keys(initialValues).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as Record<keyof TFields, boolean>),
            errors: {}
          }
        })
      },
      
      Submitting: {
        // Submission succeeded
        success: (response, state) => ({
          key: "Success",
          data: {
            values: state.data.values,
            response
          }
        }),
        
        // Submission failed
        error: (errorMessage: string, state) => ({
          key: "Error",
          data: {
            values: state.data.values,
            error: errorMessage
          }
        })
      },
      
      Success: {
        // Reset form after success
        reset: () => ({
          key: "Pristine",
          data: {
            values: initialValues,
            touched: Object.keys(initialValues).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as Record<keyof TFields, boolean>),
            errors: {}
          }
        })
      },
      
      Error: {
        // Try submitting again
        submit: (state) => ({
          key: "Submitting",
          data: {
            values: state.data.values
          }
        }),
        
        // Reset form after error
        reset: () => ({
          key: "Pristine",
          data: {
            values: initialValues,
            touched: Object.keys(initialValues).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as Record<keyof TFields, boolean>),
            errors: {}
          }
        })
      }
    },
    "Pristine" // Initial state
  );
}

// Form component to demonstrate the form machine
export function FormMachineDemo() {
  // Create a login form machine
  const loginForm = React.useMemo(() => {
    return createFormMachine({
      // Initial values
      initialValues: {
        email: "",
        password: ""
      },
      
      // Validation function
      validate: (values) => {
        const errors: Record<string, string | null> = {
          email: null,
          password: null
        };
        
        if (!values.email) {
          errors.email = "Email is required";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
          errors.email = "Invalid email address";
        }
        
        if (!values.password) {
          errors.password = "Password is required";
        } else if (values.password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        
        return errors;
      }
    });
  }, []);

  // State for tracking async operations
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginForm.submit();
    
    if (loginForm.state.is("Submitting")) {
      setIsSubmitting(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        loginForm.success({ user: { id: 1, name: "User" } });
      } catch (error) {
        loginForm.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Styles for the form
  const styles = {
    form: {
      maxWidth: "400px",
      margin: "0 auto",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif"
    },
    formGroup: {
      marginBottom: "16px"
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontWeight: "bold"
    },
    input: {
      width: "100%",
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "16px"
    },
    inputInvalid: {
      border: "1px solid #ff3860"
    },
    errorMessage: {
      color: "#ff3860",
      fontSize: "14px",
      marginTop: "4px"
    },
    button: {
      backgroundColor: "#485fc7",
      color: "white",
      border: "none",
      padding: "10px 15px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
      marginRight: "10px"
    },
    resetButton: {
      backgroundColor: "#f14668",
      color: "white",
      border: "none",
      padding: "10px 15px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px"
    },
    successMessage: {
      backgroundColor: "#23d160",
      color: "white",
      padding: "10px",
      borderRadius: "4px",
      marginBottom: "16px"
    },
    errorBanner: {
      backgroundColor: "#ff3860",
      color: "white",
      padding: "10px",
      borderRadius: "4px",
      marginBottom: "16px"
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Login Form</h2>
        
        {/* Display success message */}
        {loginForm.state.is("Success") && (
          <div style={styles.successMessage}>
            Login successful! Welcome back, {loginForm.state.data.response.user.name}!
          </div>
        )}
        
        {/* Display error message */}
        {loginForm.state.is("Error") && (
          <div style={styles.errorBanner}>
            {loginForm.state.data.error}
          </div>
        )}
        
        {/* Email field */}
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={loginForm.state.match({
              Pristine: (data) => data.values.email,
              Editing: (data) => data.values.email,
              Invalid: (data) => data.values.email,
              Submitting: (data) => data.values.email,
              Success: (data) => data.values.email,
              Error: (data) => data.values.email
            })}
            onChange={(e) => loginForm.updateField("email", e.target.value)}
            style={{
              ...styles.input,
              ...(loginForm.state.is("Invalid") && 
                 loginForm.state.data.touched.email && 
                 loginForm.state.data.errors.email ? styles.inputInvalid : {})
            }}
          />
          {loginForm.state.is("Invalid") && 
           loginForm.state.data.touched.email && 
           loginForm.state.data.errors.email && (
            <div style={styles.errorMessage}>
              {loginForm.state.data.errors.email}
            </div>
          )}
        </div>
        
        {/* Password field */}
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            value={loginForm.state.match({
              Pristine: (data) => data.values.password,
              Editing: (data) => data.values.password,
              Invalid: (data) => data.values.password,
              Submitting: (data) => data.values.password,
              Success: (data) => data.values.password,
              Error: (data) => data.values.password
            })}
            onChange={(e) => loginForm.updateField("password", e.target.value)}
            style={{
              ...styles.input,
              ...(loginForm.state.is("Invalid") && 
                 loginForm.state.data.touched.password && 
                 loginForm.state.data.errors.password ? styles.inputInvalid : {})
            }}
          />
          {loginForm.state.is("Invalid") && 
           loginForm.state.data.touched.password && 
           loginForm.state.data.errors.password && (
            <div style={styles.errorMessage}>
              {loginForm.state.data.errors.password}
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <button 
          type="submit" 
          style={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        
        {/* Reset button */}
        <button 
          type="button"
          onClick={() => loginForm.reset()}
          disabled={isSubmitting}
          style={styles.resetButton}
        >
          Reset
        </button>
        
        {/* Form state display for debugging */}
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <strong>Current State:</strong> {loginForm.state.key}
        </div>
      </form>
    </div>
  );
}
