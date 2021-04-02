/*     Lode Runner

Autores: Duarte Gabriel (56186), Rafael Riveiro (55979)


Todas as funcionalidades do trabalho foram feitas.

Existem raros bugs em que os robots ficam presos sem conseguirem sair
depois de cair num bloco que tenha sido destruido. Para que um nivel 
nao fique sem o ouro total, quando os robos morrem com o ouro na sua
posse, o ouro da respawn nas coordenadas originais.


Audio: https://freesound.org/people/LittleRobotSoundFactory/packs/16681/

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global

let empty, hero, control, levelControl, htmlControl;


// ACTORS

class Actor {
    constructor(x, y, imageName) {
		this.x = x;
		this.y = y;
		this.imageName = imageName;
		this.time = 0;	// timestamp used in the control of the animations
		this.show();
	}
	draw(x, y) {
		control.ctx.drawImage(GameImages[this.imageName],
				x * ACTOR_PIXELS_X, y* ACTOR_PIXELS_Y);
	}
    move(dx, dy) {
		this.hide();
		this.x += dx;
		this.y += dy;
		this.show();
	}
	animation() {
	}
    isWalkable(){
        return false;
	}
	isClimbable(){
		return false;
	}
	isFallable(){
		return false;
	}
	isHoldable(){
		return false;
	}
	isCollectable(){
		return false;
	}
	isSolid(){
		return false;
	}
	isBreakable(){
		return false;
	}
}

class PassiveActor extends Actor {
	show() {
		control.world[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.world[this.x][this.y] = empty;
		empty.draw(this.x, this.y);
	}
	isVisible(){
		return true;
	}
}

class ActiveActor extends Actor {
    constructor(x, y, imageName) {
		super(x, y, imageName);
	}
	show() {
		control.worldActive[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.worldActive[this.x][this.y] = empty;
		control.world[this.x][this.y].draw(this.x, this.y);
	}
	isGenerous(){
		return false;
	}
}

class Brick extends PassiveActor {
	constructor(x, y) { super(x, y, "brick"); }
	isSolid(){
		return true;
	}
	isBreakable(){
		return true;
	}
}

class HiddenBlock extends PassiveActor {
	constructor(x, y, block) { 
		super(x, y, "empty"); 
		this.initialTime = control.time;
		this.blockBehind = block;
	}
	isSolid(){
		return false;
	}
	isBreakable(){
		return false;
	}
	isFallable(){
		return true;
	}
	isWalkable(){
		return true;
	}
	animation(){
		if(this.time == (this.initialTime + 72)){
			this.hide();
			this.blockBehind.show();
		}
	}
}

class Chimney extends PassiveActor {
	constructor(x, y) { super(x, y, "chimney"); }
	isFallable(){
		return true;
	}
}

class Empty extends PassiveActor {
	constructor() { super(-1, -1, "empty"); }
	show() {}
	hide() {}
	isWalkable(){
		return true;
	}
	isFallable(){
		return true;
	}
}

class Gold extends PassiveActor {
	constructor(x, y) { super(x, y, "gold"); }
    isWalkable(){
        return true;
	}
	isFallable(){
		return true;
	}
	isCollectable(){
		return true;
	}
}

class Invalid extends PassiveActor {
	constructor(x, y) { super(x, y, "invalid"); }
}

class Ladder extends PassiveActor {
	constructor(x, y) {
		super(x, y, "empty");
		this.visible = false;
	}
	isVisible(){
		return this.visible;
	}
	makeVisible() {
		this.visible = true;
		this.imageName = "ladder";
		this.show();
	}
	isClimbable(){
		return true;
	}
}

class Rope extends PassiveActor {
	constructor(x, y) { super(x, y, "rope"); }
	isHoldable(){
		return true;
	}
}

class Stone extends PassiveActor {
	constructor(x, y) { super(x, y, "stone"); }
	isSolid(){
		return true;
	}
}

class Boundary extends Stone {
	constructor() { super(-1, -1); }
	show() {}
	hide() {}
}

class Hero extends ActiveActor {
	constructor(x, y) {
		super(x, y, "hero_runs_left");
		this.isShooting = false;
	}

	isGenerous(){
		return true;
	}

	animation() {
		let behind = control.getBehind(this.x, this.y);
		if(this.isFalling()){
			this.move(0,1);
			return;
		}
		var k = control.getKey();
        if( k == ' ' ) {
			this.shoot();
		} else {
			this.isShooting = false;
		}
		if( k == null ){
			/* nothing */
		}
		else{
			let [dx, dy] = k;
			this.move(dx, dy);
		}
		hero = control.get(this.x, this.y);
		levelControl.displayGameTime();
		if(behind.isSolid()){
			this.commitDeath();
		}
	}

	move(dx, dy){
		let next = control.get(this.x + dx, this.y + dy);
		let behind = control.getBehind(this.x, this.y);
		let behindAtFeet = control.get(this.x, this.y+1);
		if(!next.isSolid()){
			if((behind.isFallable() && !behind.isWalkable()) 
				&& behindAtFeet.isSolid()){
				return;
			}
			if(dx != 0 && next.isFallable() && !next.isWalkable()){
				return;
			}
			this.hide();
			if(dy < 0 && !behind.isClimbable()){
				dy = 0;
			}
			if(behind.isClimbable()){
				if(dy < 0 && !behind.isVisible())
					dy = 0;
			}
			if(dy > 0 && !next.isClimbable() && !next.isFallable() 
				&& !next.isHoldable()){
				dy = 0;
			}
			this.x += dx;
			this.y += dy;
			this.show(dx);
			if(next instanceof ActiveActor && !next.isGenerous()){
				this.commitDeath();
			}
			if(next.isCollectable()){
				levelControl.increaseGold();
			}
			if(this.y == 0 && behind.isClimbable()){
				levelControl.endLevel();
			}	
		}
	}

	isFalling(){
		let behind = control.getBehind(this.x, this.y);
		let atFeet = control.get(this.x, this.y + 1);
		if( (behind.isFallable() || !behind.isVisible()) && (
			 (atFeet instanceof PassiveActor && !atFeet.isVisible()) || 
			 atFeet.isFallable() || atFeet.isHoldable()) ){
			return true;
		}
		return false;
	}

	shoot(){
		if(!this.imageName.includes("runs") 
			&& !this.imageName.includes("shoots")){
			/*nothing*/ 
		}else {
			let block = empty;
			let aboveBlock = empty;
			let side = "";
			if(this.imageName == "hero_runs_right" 
				|| this.imageName == "hero_shoots_right"){
				side = "right";
			}else if(this.imageName == "hero_runs_left" 
					||  this.imageName == "hero_shoots_left"){
				side = "left";
			}
			if(side == "left"){
				block = control.getBehind(this.x-1, this.y+1);
				aboveBlock = control.getBehind(this.x-1, this.y);
			} else if(side == "right"){
				block = control.getBehind(this.x+1, this.y+1);
				aboveBlock = control.getBehind(this.x+1, this.y);
			}
			if(block.isBreakable()){
				this.isShooting = true;
				if(!aboveBlock.isSolid()){
					htmlControl.playAudioShoot();
					block.hide();
					this.move(0, 0);
					if(side == "left"){
						block = new HiddenBlock(this.x-1, this.y+1, block);
					} else if(side == "right"){
						block = new HiddenBlock(this.x+1, this.y+1, block);
					}
				} 
				this.recoil(side);
			}
		}
	}

	recoil(side){
		// behind = nas costas do heroi
		let next = empty;
		let behindAtFeet = empty;
		if(side == "left"){
			next = control.getBehind(this.x+1, this.y);
			behindAtFeet = control.getBehind(this.x+1, this.y+1);
		} else if(side == "right"){	
			next = control.getBehind(this.x-1, this.y);
			behindAtFeet = control.getBehind(this.x-1, this.y+1);
		}
		if(behindAtFeet.isSolid() || behindAtFeet.isClimbable() 
			|| next.isHoldable()){
			if(side == "left"){
				this.move(1, 0);
			} else if(side == "right"){
				this.move(-1, 0);
			}
		}
	}

	commitDeath(){
		levelControl.gameOver();
    }

	show(dx){
		let behind = control.getBehind(this.x, this.y);
		let atFeet = control.get(this.x, this.y+1);
		// Tratar a escada final quando esta invisivel como empty
		if(!behind.isVisible()){
			behind = empty;
		}
		if(this.isShooting == true){
			if(behind.isWalkable()){
				if(this.imageName.includes("right")){
					this.imageName = "hero_shoots_right";
				}else this.imageName = "hero_shoots_left";
			} else this.isShooting = false;
		}
		if(this.isShooting == false) {
			if(this.isFalling()){
				if(this.imageName.includes("right")){
					this.imageName = "hero_falls_right";
				}else this.imageName = "hero_falls_left";
				if(dx == 1){
					this.imageName = "hero_falls_right";
				} else if (dx == -1) {
					this.imageName = "hero_falls_left";
				}
			}
			if((behind.isFallable()) && behind.isVisible()){
				if(atFeet.isSolid() || (atFeet instanceof PassiveActor 
					&& atFeet.isClimbable() && atFeet.isVisible()) 
					|| (atFeet instanceof ActiveActor && !atFeet.isGenerous())){
					switch( dx ){
						case 1: 
							this.imageName = "hero_runs_right";
							break;
						case -1: 
							this.imageName = "hero_runs_left";
							break;
						default: if(this.imageName.includes("right")){
									this.imageName = "hero_runs_right";
								}else {
									this.imageName = "hero_runs_left";
								}
					}
				}
			}
			if(behind.isClimbable() && behind.isVisible()){
				if(this.imageName.includes("right")){
					this.imageName = "hero_on_ladder_left";
				}else this.imageName = "hero_on_ladder_right";
			}
			if(behind.isHoldable()){
				switch( dx ){
					case 1: 
						this.imageName = "hero_on_rope_right";
						break;
					case -1: 
						this.imageName = "hero_on_rope_left";
						break;
					default: if(this.imageName.includes("right")){
								this.imageName = "hero_on_rope_right";
							}else {
								this.imageName = "hero_on_rope_left";
							}
						
				}
			}
		} 
		if(behind.isCollectable()){
			behind.hide();
		}
		super.show();
	}

}

class Robot extends ActiveActor {
	constructor(x, y) {
		super(x, y, "empty");
		this.dx = 1;
		this.dy = 0;
		this.distToHero = 0;
		this.counterIsStuck = -1;
		this.hasGold = 0;
		this.gold = empty;
	}

	animation() {
		if(control.time % levelControl.robotSpeed == 0){
			this.moveManagement();
		}
	}

	move(){
		let next = control.get(this.x+this.dx,this.y+this.dy);
		let nextBehind = control.getBehind(this.x+this.dx,this.y+this.dy);
		let behind = control.getBehind(this.x, this.y);
		let behindAtFeet = control.get(this.x, this.y+1);
		if(next instanceof ActiveActor && !next.isGenerous()){
			/* nothing */ 
		} else {
			if((behind.isFallable() && !behind.isWalkable()) 
				&& (behindAtFeet.isSolid() 
				|| (behindAtFeet instanceof ActiveActor && !behindAtFeet.isGenerous()))){
				return;
			}
			if(this.dx != 0 && nextBehind.isFallable() 
				&& !nextBehind.isWalkable()){
				return;
			}
			if(next.isCollectable() && this.hasGold == false){
				this.hasGold = true;
				this.gold = next;
				this.gold.hide();
			}
			this.hide();
			this.x += this.dx;
			this.y += this.dy;
			this.show();
		}
		if(this.x === hero.x && this.y === hero.y){
			this.killHero();
		}
	}

	moveManagement(){
		let behind = control.getBehind(this.x, this.y);
		if(behind instanceof HiddenBlock){
			this.isStuck();
			return;
		}
		if(behind.isSolid()){
			this.commitDeath()
			return;
		}
		if(this.isFalling()){
			this.dy = 1;
			this.dx = 0;
			this.move();
			return;
		}
        let arrBlocks = new Array();
        let above = control.getBehind(this.x, this.y-1);
        let atFeet = control.getBehind(this.x, this.y+1);
        let left = control.getBehind(this.x-1, this.y);
        let right = control.getBehind(this.x+1, this.y);
        let distAbove = distance(this.x, this.y-1, hero.x, hero.y);
        let distAtFeet = distance(this.x, this.y+1, hero.x, hero.y);
        let distLeft = distance(this.x-1, this.y, hero.x, hero.y);
		let distRight = distance(this.x+1, this.y, hero.x, hero.y);

		if(hero.y < this.y){
			if(behind.isClimbable() && behind.isVisible()){
				this.dy = -1;
				this.dx = 0;
			}
			else if(this.findLadder() != null && this.findLadder() < this.x){
				this.dx = -1;
				this.dy = 0;
			}
			else if(this.findLadder() > this.x){
				this.dx = 1;
				this.dy = 0;
			}
			else{
				this.dx = 0;
				this.dy = 0;
			}
			this.move();
			return;
		}
		if(((atFeet.isClimbable() && atFeet.isVisible()) 
			|| (behind.isHoldable() && !atFeet.isSolid())) && hero.y > this.y){
			this.dy = 1;
			this.dx = 0;
			this.move();
			return;
		}
        if(above.isClimbable()){
            arrBlocks.push(["above", distAbove]);
        }
        if(!atFeet.isSolid()){
            arrBlocks.push(["atFeet", distAtFeet]);
        }
        if(!left.isSolid()){
            arrBlocks.push(["left", distLeft]);
        }
        if(!right.isSolid()){
            arrBlocks.push(["right", distRight]);
        }
        arrBlocks.sort((a, b) => b[1] - a[1]);
        let aux = arrBlocks.pop();
        if(aux[0] == "above"){
			this.dx = 0;
			this.dy = -1;
        }else if(aux[0] == "atFeet"){
			this.dx = 0;
			this.dy = 1;
        }else if(aux[0] == "left"){ 
            this.dx = - 1;
            this.dy = 0;
        }else if(aux[0] == "right"){
            this.dx = 1;
            this.dy = 0;
        } else {
            this.dx = 0;
			this.dy = 0;
		}
		this.move();
	}

	isFalling(){
		let behind = control.getBehind(this.x, this.y);
		let atFeet = control.get(this.x, this.y + 1);
		if( ( behind.isFallable() || !behind.isVisible() ) 
		&& ( (atFeet instanceof PassiveActor && !atFeet.isVisible() ) 
		|| ( atFeet.isFallable() 
		||   atFeet.isHoldable() 
		||   atFeet instanceof HiddenBlock ) ) ){
			return true;
		}
		return false;
	}

	isStuck(){
		if(this.counterIsStuck == -1){
			this.counterIsStuck = control.time;
			let above = control.get(this.x, this.y-1);
			let aboveLeft  = control.get(this.x-1, this.y-1);
			let aboveRight = control.get(this.x+1, this.y-1);
			let atFeetLeft = control.get(this.x-1, this.y);
			let atFeetRight = control.get(this.x+1, this.y);
			if(this.hasGold == true){
				if(above.isWalkable() && !above.isCollectable()){
					this.gold.x = this.x;
					this.gold.y = this.y-1;
				} else if(aboveLeft.isWalkable() && atFeetLeft.isSolid()
							&& !aboveLeft.isCollectable()){
					this.gold.x = this.x-1;
					this.gold.y = this.y-1;
				} else if(aboveRight.isWalkable() && atFeetRight.isSolid()
							&& !aboveRight.isCollectable()){
					this.gold.x = this.x+1;
					this.gold.y = this.y-1;
				} 
					this.gold.show();
					this.hasGold = false;
			}
		}
		if(control.time == this.counterIsStuck + 40){
			this.counterIsStuck = -1;
			this.exitHiddenBlock();
		}
	}

	exitHiddenBlock(){
		let aboveLeft  = control.get(this.x-1, this.y-1);
		let aboveRight = control.get(this.x+1, this.y-1);
		let leftAvailable = true;
		let rightAvailable = true;
		if(aboveLeft.isSolid()  || (aboveLeft instanceof ActiveActor 
			&& !aboveLeft.isGenerous())){
			leftAvailable = false;
		}
		if(aboveRight.isSolid() || (aboveRight instanceof ActiveActor 
			&& !aboveRight.isGenerous())){
			rightAvailable = false;
		}
		if(leftAvailable == true && rightAvailable == true){
			if(hero.x <= this.x){
				this.dx = -1;
				this.dy = -1;
			}else {
				this.dx = 1;
				this.dy = -1;
			}
		} else if(leftAvailable == true){
				this.dx = -1;
				this.dy = -1;
		} else if(rightAvailable == true){
				this.dx = 1;
				this.dy = -1;
		}
		this.move();
	}

	hasClearPath(x){
		if(x < this.x){
			for(let i = x; i < this.x; i++){
				let behind = control.getBehind(i,this.y);
				if(behind.isSolid()){
					return false;
				}
			}
		} else if(x > this.x){
			for(let i = this.x+1; i <= x; i++){
				let behind = control.getBehind(i,this.y);
				if(behind.isSolid()){
					return false;
				}
			}
		} 
		return true;
	}

	findLadder(){
		let distanceToLadder = WORLD_WIDTH;
		let coordX = null;
		for(let x=0 ; x < WORLD_WIDTH; x++){
			let behind = control.getBehind(x,this.y);
			if(distance(x, this.y , this.x, this.y) < distanceToLadder 
				&& behind.isClimbable() && behind.isVisible()){
				if(this.hasClearPath(x)){
					distanceToLadder = distance(x, this.y , this.x, this.y);
					coordX = x;
				}
			}
		}
		return coordX;
	}

	killHero(){
		hero.commitDeath();
	}

	commitDeath(){
		htmlControl.playAudioRobotDeath();
		this.hide();
		if(this.hasGold == true){
			this.gold.show();
			this.hasGold = false;
		}
		this.x = rand(27);
		this.y = 0;
		if(control.get(this.x, this.y).isSolid()){
			this.commitDeath();
		}
		this.show();
	}

	show(){
		let behind = control.getBehind(this.x, this.y);
		let atFeet = control.get(this.x, this.y+1);
		// Tratar a escada final quando esta invisivel como empty
		if(!behind.isVisible()){
			behind = empty;
		}
		if(this.time > 0){
			if(this.isFalling()){
				if(this.imageName.includes("right")){
					this.imageName = "robot_falls_right";
				}else this.imageName = "robot_falls_left";
				if(this.dx == 1){
					this.imageName = "robot_falls_right";
				} else if (this.dx == -1) {
					this.imageName = "robot_falls_left";
				}
			}
		}
		if(behind.isFallable() && behind.isVisible()){
			if(atFeet.isSolid() || (atFeet instanceof PassiveActor 
				&& atFeet.isClimbable() && atFeet.isVisible()) 
				|| (atFeet instanceof ActiveActor && !atFeet.isGenerous())){
				switch( this.dx ){
					case 1: 
						this.imageName = "robot_runs_right";
						break;
					case -1: 
						this.imageName = "robot_runs_left";
						break;
					default: if(this.imageName.includes("right")){
								this.imageName = "robot_runs_right";
							}else {
								this.imageName = "robot_runs_left";
							}
				}
			}
		}
		if(behind.isClimbable() && behind.isVisible()){
			if(this.imageName.includes("right")){
				this.imageName = "robot_on_ladder_left";
			}else this.imageName = "robot_on_ladder_right";
		}
		if(behind.isHoldable()){
			switch( this.dx ){
				case 1: 
					this.imageName = "robot_on_rope_right";
					break;
				case -1: 
					this.imageName = "robot_on_rope_left";
					break;
				default: if(this.imageName.includes("right")){
							this.imageName = "robot_on_rope_right";
						}else {
							this.imageName = "robot_on_rope_left";
						}
					
			}
		}
		super.show();
	}
}


// LEVEL CONTROL

class LevelControl {
	constructor() {
		this.currentLvl = 1;
		this.loadLevel(this.currentLvl);
		this.currentGold = 0;
		this.totalGold = this.getTotalGold();
		this.robotSpeed = 4;
	}

	loadLevel(level) {
		if( level < 1 || level > MAPS.length )
			fatalError("Invalid level " + level)
		let map = MAPS[level-1];  // -1 because levels start at 1
        for(let x=0 ; x < WORLD_WIDTH ; x++)
            for(let y=0 ; y < WORLD_HEIGHT ; y++) {
					// x/y reversed because map stored by lines
				GameFactory.actorFromCode(map[y][x], x, y);
			}
	}

	displayGameTime(){
		htmlControl.displayGameTime();
	}

	setRobotSpeed(speed){
		switch(speed){
			case "1":
				this.robotSpeed = 6;
				break;
			case "2":
				this.robotSpeed = 4;
				break;
			case "3": 
				this.robotSpeed = 2;
				break;
		}
	}

	getTotalGold(){
		let totalGold = 0;
		for(let x = 0; x < WORLD_WIDTH; x++){
			for(let y = 0; y < WORLD_HEIGHT ; y++){
				if(control.world[x][y].isCollectable()){
					totalGold++;
				}
			}
		}
		return totalGold;
	}

	increaseGold(){
		this.currentGold++;
		htmlControl.displayGold();
		htmlControl.playAudioGold();
        if(this.currentGold == this.totalGold){
            this.showFinalLadder();
        }
	}
	
	showFinalLadder(){
		for(let x=0 ; x < WORLD_WIDTH ; x++)
            for(let y=0 ; y < WORLD_HEIGHT ; y++) {
				if(!control.world[x][y].isVisible())
					control.world[x][y].makeVisible();
			}
	}

	hideLevel(){
		for(let x = 0; x < WORLD_WIDTH; x++){
			for(let y = 0; y < WORLD_HEIGHT ; y++){
				control.world[x][y].hide();
				control.worldActive[x][y].hide();
			}
		}
	}

	endLevel(){ 
		if(this.currentGold == this.totalGold){
			this.levelUp();
		}
	}

	levelUp(){
		if(this.currentLvl >= MAPS.length){
			this.endGame();
		} else {
			htmlControl.playAudioLevelUp();
			this.hideLevel();
			this.currentLvl++;
			this.loadLevel(this.currentLvl);
			this.currentGold = 0;
			this.totalGold = this.getTotalGold();
			htmlControl.displayGold();
			htmlControl.displayLevel();
		}
		
	}

	gameOver(){
		control.gameOver();
		htmlControl.deathScreen();
	}

	restartGame(){
		this.hideLevel();
		control.time = 0;
		this.currentLvl = 1;
		this.loadLevel(this.currentLvl);
		this.currentGold = 0;
		htmlControl.displayGold();
		this.totalGold = this.getTotalGold();
		htmlControl.displayLevel();
	}

	endGame(){
		control.gameOver();
		htmlControl.endGame()
	}
}


// GAME CONTROL

class GameControl {
	constructor() {
		control = this;
		this.key = 0;
		this.time = 0;
		this.ctx = document.getElementById("canvas1").getContext("2d");
		empty = new Empty();	// only one empty actor needed
		this.boundary = new Boundary();
		this.world = this.createMatrix();
		this.worldActive = this.createMatrix();
		this.setupEvents();
		levelControl = new LevelControl();
		htmlControl = new HTMLControl();
		htmlControl.displayGold();
		htmlControl.displayLevel();
		this.isPaused = true;
		this.isGameOver = false;
	}

	createMatrix() { // stored by columns
		let matrix = new Array(WORLD_WIDTH);
		for( let x = 0 ; x < WORLD_WIDTH ; x++ ) {
			let a = new Array(WORLD_HEIGHT);
			for( let y = 0 ; y < WORLD_HEIGHT ; y++ )
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	}

	getKey() {
		let k = control.key;
		control.key = 0;
		switch( k ) {
			case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
			case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
			case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
			case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
			case 27: htmlControl.showPauseMenu(); break;
			case 0: return null;
			default: return String.fromCharCode(k);
		// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		};
	}

	setupEvents() {
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
		setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
	}

	animationEvent() {
		if(control.isGameOver == true){
			/* nothing */
		} else if(control.isPaused == true){
			let k = control.getKey();
			if(k == 27){
				this.resumeGame();
			}
		} else {
			control.time++;
			for(let x=0 ; x < WORLD_WIDTH ; x++){
				for(let y=0 ; y < WORLD_HEIGHT ; y++) {
					let a = control.worldActive[x][y];
					let b = control.world[x][y];
					if( a.time < control.time ) {
						a.time = control.time;
						a.animation();
					}
					if( b.time < control.time ) {
						b.time = control.time;
						b.animation();
					}
				}
			}
		}
	}

	keyDownEvent(k) {
		control.key = k.keyCode;
	}
	
	keyUpEvent(k) {
	}

	isInside(x, y){
		return 0 <= x && x < WORLD_WIDTH && 0 <= y && y < WORLD_HEIGHT;
	}

	get(x, y){
		if(!this.isInside(x,y)){
			return this.boundary;
		}
		else if(control.worldActive[x][y] !== empty){
			return control.worldActive[x][y];
		}
		else{
			return control.world[x][y];
		}
	}

	getBehind(x, y){
		if(!this.isInside(x,y)){
			return this.boundary;
		}
		return control.world[x][y];
	}

	pauseGame(){
		this.isPaused = true;
	}

	resumeGame(){
		this.isPaused = false;
	}

	gameOver(){
		this.isGameOver = true;
	}


}


// HTML FORM

class HTMLControl {
	constructor(){
		this.audioBackGround = null;
		this.audioHeroDeath = null;
		this.audioGold = null;
		this.audioLevelUp = null;
		this.audioShoot = null;
		this.audioRobotDeath = null;
		this.audioMenuEscape = null;
		this.audioMenuButton = null;
	}
	setRobotSpeed(speed){
		levelControl.setRobotSpeed(speed);
	}
	playAudioBackGround(){
		if(this.audioBackGround == null){
			this.audioBackGround = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716305104353099776/Legend_of_Zelda_Ocarina_of_Time_Gerudo_Valley_8-bit.mp3");
		}
		this.audioBackGround.volume = 0.2;
		this.audioBackGround.loop = true;
		this.audioBackGround.play();
	}
	playAudioHeroDeath(){ 
		if(this.audioHeroDeath == null){
			this.audioHeroDeath = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716071701288583238/8-bit_Coffin_Dance_from._Astronomia_online-audio-converter.com.mp3");
		}
		this.audioHeroDeath.volume = 0.2;
		this.audioHeroDeath.play();
	}
	playAudioGold(){
		if(this.audioGold == null) {
			this.audioGold = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716087549168451645/270303__littlerobotsoundfactory__collect-point-01.wav");
		}
		this.audioGold.volume = 0.2;
		this.audioGold.play();
	}
	playAudioLevelUp(){
		if(this.audioLevelUp == null){
			this.audioLevelUp = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716262084928602122/270331__littlerobotsoundfactory__jingle-achievement-00.wav");
		}
		this.audioLevelUp.volume = 0.2;
		this.audioLevelUp.play();
	}
	playAudioShoot(){
		if(this.audioShoot == null) {
			this.audioShoot = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716088486729613372/270343__littlerobotsoundfactory__shoot-01.wav");
		}
		this.audioShoot.volume = 0.2;
		this.audioShoot.play();
	}
	playAudioRobotDeath(){
		if(this.audioRobotDeath == null) {
			this.audioRobotDeath = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716414015613567067/270328__littlerobotsoundfactory__hero-death-00_mp3cut.net.wav");
		}
		this.audioRobotDeath.volume = 0.1;
		this.audioRobotDeath.play();
	}
	playAudioMenuEscape(){
		if(this.audioMenuEscape == null) {
			this.audioMenuEscape = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716466682901823488/270315__littlerobotsoundfactory__menu-navigate-03.wav");
		}
		this.audioMenuEscape.volume = 0.2;
		this.audioMenuEscape.play();
	}
	playAudioMenuButton(){
		if(this.audioMenuButton == null) {
			this.audioMenuButton = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716468648650211378/270324__littlerobotsoundfactory__menu-navigate-00.wav");
		}
		this.audioMenuButton.volume = 0.2;
		this.audioMenuButton.play();
	}
	playAudioWinGame(){
        if(this.audioLevelUp == null){
            this.audioLevelUp = new Audio("https://cdn.discordapp.com/attachments/591014736456450068/716089235278397471/270319__littlerobotsoundfactory__jingle-win-01.wav");
        }
        this.audioLevelUp.volume = 0.2;
        this.audioLevelUp.play();
	}
	pauseAudioBackground(){
		if(this.audioBackGround != null){
			this.audioBackGround.pause();
			this.audioBackGround.currentTime = 0;
		}	
	}
	pauseAudioHeroDeath(){
		if(this.audioHeroDeath != null){
			this.audioHeroDeath.pause();
			this.audioHeroDeath.currentTime = 0;
		}
	}
	displayGold(){
        document.getElementById("currentGold").value = levelControl.currentGold;
	}
	displayLevel(){
		document.getElementById("currentLevel").value = levelControl.currentLvl;
	}
	displayGameTime(){
		document.getElementById("time").value = control.time;
	}
	showPauseMenu(){
		this.playAudioMenuEscape();
		if(control.isPaused == true){
			control.resumeGame();
			document.getElementById("gamePaused").style.display="none";
		} else {
			control.pauseGame();
			document.getElementById("gamePaused").style.display="inline";
			document.getElementById("gamePaused").style.marginLeft="0px";
		}
	}
	deathScreen(){
		let video = document.getElementById("video");
		if(video.style.display == "none") {
			video.currentTime = 0;
		}
		video.style.display="inline";	
		document.getElementById("restart").style.display="inline";
		document.getElementById("youDied").style.display="inline";
		this.pauseAudioBackground();
        this.playAudioHeroDeath();
        document.getElementById("game").style.display="none";
	}
	quitGame(){
		control.gameOver();
		document.getElementById("gamePaused").style.display="none";
		document.getElementById("video").style.display="none";
		document.getElementById("youDied").style.display="none";
		document.getElementById("game").style.display="none";
		document.getElementById("winScreen").style.display="none";
		this.pauseAudioHeroDeath();
		this.pauseAudioBackground();
		document.getElementById("startMenu").style.display="inline";
	}
	restartGame(){
		document.getElementById("startMenu").style.display="none";
		document.getElementById("gamePaused").style.display="none";
		document.getElementById("video").style.display="none";
		this.pauseAudioHeroDeath();
		document.getElementById("restart").style.display="none";
		document.getElementById("youDied").style.display="none";
		document.getElementById("game").style.display="inline";
		htmlControl.playAudioBackGround();
		control.isPaused = false;
		control.isGameOver = false;
		levelControl.restartGame();
	}
	endGame(){
		this.pauseAudioBackground();
		this.playAudioWinGame();
		document.getElementById("game").style.display="none";
		document.getElementById("winScreen").style.display="inline";
	}
}

function onLoad() {
  // Asynchronously load the images an then run the game
  	document.body.style.zoom="170%";
	GameImages.loadAll(function() { new GameControl(); });
}

function setRobotSpeed(){
	var speed = document.getElementById("difficulty").value;
	htmlControl.setRobotSpeed(speed);
}

function playAudioBackground(){
	htmlControl.playAudioBackGround();
}

function playAudioMenuButton(){
	htmlControl.playAudioMenuButton();
}

function pauseAudioBackground(){
	htmlControl.pauseAudioBackground();
}

function restartGame(){
	htmlControl.restartGame();
}

function quitGame(){
	htmlControl.quitGame();
}






