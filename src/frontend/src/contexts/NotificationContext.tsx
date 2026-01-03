import React from 'react';

export const useNotification = () => {
  return {
    showNotification: (params: any) => console.log('Notification:', params),
    showErrorNotification: (params: any) => console.error('Error Notification:', params)
  };
};
