
class Content {

  constructor(data) {
    var self = this;

    this.data = data || [];

    build();

    function build() {

      self.object = document.createElement("div");
      self.object.classList.add("content");

      self.grid = document.createElement("div");
      self.grid.classList.add("grid");

      self.blocks = [];

      self.data.forEach(item => {

        var block = document.createElement("div");
        var blockSize = item.size;

        block.classList.add("block");
        block.classList.add("faded");

        if(window.innerWidth < 600) {
          blockSize = 3;
        } else if (window.innerWidth < 1000) {
          blockSize+=1;
        }

        block.classList.add("block-size-" + blockSize);

        if (item.img) {
          item.img.forEach(src => {

            var img = document.createElement("img");
            img.src = src;

            block.appendChild(img);
          })
        }

        if (item.txt) {

          var color = ["grey", "lightgrey", "darkgrey"][random(0,2)];

          var txt = document.createElement("div");
          txt.classList.add("text");
          txt.innerHTML = item.txt
          txt.style.backgroundColor =  color;

          block.appendChild(txt);
        }

        self.blocks.push(block);
      });

      //shuffle(self.blocks);

      self.blocks.forEach(block => {
        self.grid.appendChild(block);
      });

      self.object.appendChild(self.grid);
    }
  }

  update(cb) {
    var self = this;

    if (this.blocks.length == 0) return;

    imagesLoaded(this.grid, function() {

      setTimeout(function() {

        var wall = new Freewall(self.grid);

        wall.reset({
          selector: '.block',
          animate: false,
          cellW: function(width) {

            var cellWidth = width / 4;

            return cellWidth - 20;

          },
          cellH: 'auto',
          fillGap : true, // True will made layout without gap.
          gutterX : 20, // The spacing between the blocks.
          gutterY: 20,
          cacheSize: false,
          keepOrder: false,
          //fixSize: false,
          onResize: function() {
            wall.fitWidth();
          }
        });

        wall.fitWidth();

        self.blocks.forEach(block => {
          block.classList.remove("faded");
        });

        if (cb) cb();

      }, 300);
    });
  }

  get() {
    return this.object;
  }

  enable() {
    this.object.classList.add("enabled");
  }

  disable() {
    this.object.classList.remove("enabled");
  }
}
