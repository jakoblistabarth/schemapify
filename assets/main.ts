import config from "./schematization.config";
import { drawC } from "./lib/Ui/cOutput";
import { tests, drawDataSelect } from "./lib/Ui/selectData";
import { drawNavigator } from "./lib/Ui/algorithm-navigator";

drawC();
drawNavigator();
drawDataSelect(tests);
