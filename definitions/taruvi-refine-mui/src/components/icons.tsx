/**
 * Icon shim: same-named replacements for the @mui/icons-material icons this
 * template used, rendered with FontAwesome.
 *
 * @mui/icons-material cannot be a dependency on this platform: its ~6,000-file
 * tarball extraction exceeds the bundler runtime's execution budget and the
 * deploy is killed. FontAwesome is the supported icon set here. Add new icons
 * by extending this file, not by importing @mui/icons-material.
 */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBars,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronUp,
  faCopy,
  faList,
  faMagnifyingGlass,
  faRightFromBracket,
  faRotate,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";

/**
 * Wraps a FontAwesome definition in MUI's SvgIcon so existing call sites keep
 * their `fontSize` / `sx` / color props and baseline alignment.
 */
function muiIcon(icon: IconDefinition) {
  const [width, height, , , path] = [
    icon.icon[0],
    icon.icon[1],
    icon.icon[2],
    icon.icon[3],
    icon.icon[4],
  ] as const;
  const paths = Array.isArray(path) ? path : [path];
  const Component = (props: SvgIconProps) => (
    <SvgIcon {...props} viewBox={`0 0 ${width} ${height}`}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </SvgIcon>
  );
  Component.displayName = `Icon(${icon.iconName})`;
  return Component;
}

export const CheckRounded = muiIcon(faCheck);
export const ChevronLeft = muiIcon(faChevronLeft);
export const ContentCopyRounded = muiIcon(faCopy);
export const Dashboard = muiIcon(faTableColumns);
export const ExpandLess = muiIcon(faChevronUp);
export const ExpandMore = muiIcon(faChevronDown);
export const ExpandMoreRounded = muiIcon(faChevronDown);
export const ListOutlined = muiIcon(faList);
export const Logout = muiIcon(faRightFromBracket);
export const Menu = muiIcon(faBars);
export const RefreshRounded = muiIcon(faRotate);
export const Search = muiIcon(faMagnifyingGlass);

export { FontAwesomeIcon };
