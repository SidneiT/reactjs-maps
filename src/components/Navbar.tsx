import { DriveEtaSharp } from "@mui/icons-material";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";

function Navbar() {
  return (
    <AppBar position="static" enableColorOnDark>
      <Toolbar>
        <IconButton color="inherit" edge="start">
          <DriveEtaSharp />
        </IconButton>
        <Typography variant="h6">Full Cycle Delivery</Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
