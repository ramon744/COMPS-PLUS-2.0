export const getUserIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Erro ao obter IP do usuário:', error);
    return null;
  }
};

export const isIPAuthorized = (userIP: string, authorizedIP: string): boolean => {
  return userIP === authorizedIP;
};