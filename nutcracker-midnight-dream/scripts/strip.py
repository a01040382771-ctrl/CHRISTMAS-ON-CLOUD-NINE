import sys
from PIL import Image
ims=[Image.open(p) for p in sys.argv[2:]]
w,h=ims[0].size; out=Image.new('RGB',(w*len(ims),h))
for i,im in enumerate(ims): out.paste(im,(i*w,0))
out.save(sys.argv[1])
