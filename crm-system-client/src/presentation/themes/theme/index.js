// ==============================|| PRESET THEME - THEME SELECTOR ||============================== //

export default function Theme(colors) {
  const contrastText = '#fff';
  const { blue, red, gold, cyan, green, grey } = colors;

  const blueColors = {
    0: '#eef1f0', // Màu rất sáng, gần trắng
    50: '#d4dad9',
    100: '#bac2c1',
    200: '#a0aaa9',
    300: '#869291',
    400: '#6c7a79',
    500: '#586a68', // Màu gốc
    600: '#4e605e',
    700: '#434f4e',
    800: '#39403e',
    900: '#2f312f', // Màu rất tối
    A50: '#a5b3b1', // Accent sáng
    A100: '#8c9f9d',
    A200: '#748a88',
    A400: '#5b7674',
    A700: '#495e5c', // Accent tối
    A800: '#374746'
  };

  const greyColors = {
    0: grey[0],
    50: grey[1],
    100: grey[2],
    200: grey[3],
    300: grey[4],
    400: grey[5],
    500: grey[6],
    600: grey[7],
    700: grey[8],
    800: grey[9],
    900: grey[10],
    A50: grey[15],
    A100: grey[11],
    A200: grey[12],
    A400: grey[13],
    A700: grey[14],
    A800: grey[16]
  };

  const secondaryColors = {
    0: '#fbe9e3',
    50: '#f3d3c4',
    100: '#ebbea6',
    200: '#e3a988',
    300: '#db946a',
    400: '#d27f4c',
    500: '#ba7351',
    600: '#9d6246',
    700: '#80513b',
    800: '#634030',
    900: '#462f25',
    A50: '#ffebe3',
    A100: '#ffcdb3',
    A200: '#ffaf83',
    A400: '#ff9153',
    A700: '#ff7323',
    A800: '#cc5c1c'
  };

  const successColors = {
    lighter: '#e6f3e7',
    light: '#c2e0c6',
    main: '#4caf50', // Sửa màu success thành màu xanh lá khác với primary
    dark: '#3b873e',
    darker: '#2a602c',
    contrastText
  };

  return {
    primary: {
      lighter: blueColors[0],
      100: blueColors[100],
      200: blueColors[200],
      light: blueColors[300],
      400: blueColors[400],
      main: blueColors[500],
      dark: blueColors[600],
      700: blueColors[700],
      darker: blueColors[800],
      900: blueColors[900],
      contrastText
    },
    secondary: {
      lighter: secondaryColors[0], // Sửa từ secondaryColors[100] thành secondaryColors[0]
      100: secondaryColors[100],
      200: secondaryColors[200],
      light: secondaryColors[300],
      400: secondaryColors[400],
      main: secondaryColors[500],
      600: secondaryColors[600],
      dark: secondaryColors[700],
      800: secondaryColors[800],
      darker: secondaryColors[900],
      A100: secondaryColors.A50, // Sửa từ secondaryColors[0] thành secondaryColors.A50
      A200: secondaryColors.A400,
      A300: secondaryColors.A700,
      contrastText
    },
    error: {
      lighter: '#F5E6E1',
      light: '#E5C4B8',
      main: '#C18C75',
      dark: '#A66B54',
      darker: '#8B4A33',
      contrastText
    },
    warning: {
      lighter: '#F5F2ED',
      light: '#E5DFD3',
      main: '#CCC79F',
      dark: '#B3A88B',
      darker: '#9A8977',
      contrastText: greyColors[100]
    },
    info: {
      lighter: '#F5F6F5',
      light: '#E5E7E4',
      main: '#BFC2BE',
      dark: '#A3A7A1',
      darker: '#878C84',
      contrastText
    },
    success: successColors,
    grey: greyColors
  };
}
