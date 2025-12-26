// third-party
import { merge } from 'lodash';

// project import
import Badge from './Badge';
import Button from './Button';
import CardContent from './CardContent';
import Checkbox from './Checkbox';
import Chip from './Chip';
import IconButton from './IconButton';
import InputLabel from './InputLabel';
import LinearProgress from './LinearProgress';
import Link from './Link';
import ListItemIcon from './ListItemIcon';
import OutlinedInput from './OutlinedInput';
import Tab from './Tab';
import TableCell from './TableCell';
import Tabs from './Tabs';
import Typography from './Typography';

// ==============================|| OVERRIDES - MAIN ||============================== //

export default function ComponentsOverrides(theme) {
  return merge(
    {
      // Global defaultProps for all components
      MuiButton: {
        defaultProps: {
          size: 'small',  // Default size set to small
        },
      },
      MuiCheckbox: {
        defaultProps: {
          size: 'small',  // Default size set to small
        },
      },
      MuiIconButton: {
        defaultProps: {
          size: 'small',  // Default size set to small
        },
      },
      MuiOutlinedInput: {
        defaultProps: {
          size: 'small',  // Default size set to small
        },
      },
      // Any other component overrides can go here

    },
    Button(theme),
    Badge(theme),
    CardContent(),
    Checkbox(theme),
    Chip(theme),
    IconButton(theme),
    InputLabel(theme),
    LinearProgress(),
    Link(),
    ListItemIcon(),
    OutlinedInput(theme),
    Tab(theme),
    TableCell(theme),
    Tabs(),
    Typography()
  );
}
