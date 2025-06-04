import {
  IconSearch,
  IconUser,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Burger,
  Group,
  useMantineColorScheme,
  Avatar,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./HeaderSearch.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useAuth } from "../../../context/authContext";
import { doSignOut } from "../../../firebase/auth";

export function HeaderSearch() {
  const [opened, { toggle }] = useDisclosure(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const location = useLocation();
  const hideOnRoutes = [
    "/login",
    "/signup",
    "/form-submitted",
    "/form-submit",
    "/preview",
  ];

  if (hideOnRoutes.some((path) => location.pathname.startsWith(path)))
    return null;

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <Link to="/" className={classes.logoText}>
            MSFormFake
          </Link>
        </Group>

        <Group>
          <ActionIcon
            onClick={() => toggleColorScheme()}
            variant="outline"
            color={colorScheme === "dark" ? "violet" : "indigo"}
            size="lg"
          >
            {colorScheme === "dark" ? (
              <IconSun size={16} stroke={1.5} />
            ) : (
              <IconMoon size={16} stroke={1.5} />
            )}
          </ActionIcon>
          <Autocomplete
            className={classes.search}
            placeholder="Search"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            data={[
              "React",
              "Angular",
              "Vue",
              "Next.js",
              "Riot.js",
              "Svelte",
              "Blitz.js",
            ]}
            visibleFrom="xs"
          />
          {currentUser ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={currentUser.photoURL || null}
                  alt={currentUser.displayName || "User"}
                  radius="xl"
                  size="md"
                  style={{ cursor: "pointer" }}
                >
                  <IconUser size={20} />
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {currentUser.displayName || currentUser.email || "User"}
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUserCircle size={16} />}
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Avatar radius="xl" size="md" style={{ cursor: "pointer" }}>
                  <IconUser size={20} />
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUserCircle size={16} />}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </div>
    </header>
  );
}
